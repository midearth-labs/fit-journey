// Content Loader Utility
// Handles loading and parsing of static content files

import { promises as fs } from 'fs';
import path from 'path';
import { ContentType, ContentMaps, LoadOptions } from '../types';
import { CONTENT_DIRECTORIES } from '../types/constants';

export class ContentLoader {
  private contentBasePath: string;
  private contentMaps: Partial<ContentMaps> = {};
  private isInitialized = false;

  constructor(contentBasePath?: string) {
    this.contentBasePath = contentBasePath || path.join(process.cwd(), 'src', 'data', 'content');
  }

  /**
   * Initialize the content loader by loading all content files
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      await this.loadAllContent();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize content loader:', error);
      throw new Error(`Content loader initialization failed: ${error}`);
    }
  }

  /**
   * Load all content files into memory
   */
  private async loadAllContent(): Promise<void> {
    const contentTypes: ContentType[] = [
      'ContentCategory',
      'Question',
      'KnowledgeBase',
      'PassageSet',
      'StreakType',
      'UserState',
      'AvatarAsset',
      'Achievement',
      'DailyChallenge'
    ];

    for (const contentType of contentTypes) {
      try {
        await this.loadContentType(contentType);
      } catch (error) {
        console.warn(`Failed to load content type ${contentType}:`, error);
        // Continue loading other content types
      }
    }
  }

  /**
   * Load content of a specific type
   */
  private async loadContentType<T extends ContentType>(contentType: T): Promise<void> {
    const directoryName = this.getDirectoryName(contentType);
    const directoryPath = path.join(this.contentBasePath, directoryName);
    
    try {
      // Check if directory exists
      await fs.access(directoryPath);
    } catch {
      console.warn(`Content directory not found: ${directoryPath}`);
      return;
    }

    const files = await fs.readdir(directoryPath);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    if (jsonFiles.length === 0) {
      console.warn(`No JSON files found in ${directoryPath}`);
      return;
    }

    const contentMap = new Map<string, any>();
    
    for (const file of jsonFiles) {
      try {
        const filePath = path.join(directoryPath, file);
        const content = await this.loadContentFile(filePath);
        
        if (Array.isArray(content)) {
          // Handle array-based content files
          for (const item of content) {
            if (item.id) {
              contentMap.set(item.id, item);
            }
          }
        } else if (content && typeof content === 'object') {
          // Handle object-based content files
          if (content.id) {
            contentMap.set(content.id, content);
          }
        }
      } catch (error) {
        console.error(`Failed to load content file ${file}:`, error);
      }
    }

    this.contentMaps[contentType] = contentMap;
  }

  /**
   * Load a single content file
   */
  private async loadContentFile(filePath: string): Promise<any> {
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(fileContent);
    } catch (error) {
      throw new Error(`Failed to load content file ${filePath}: ${error}`);
    }
  }

  /**
   * Get directory name for content type
   */
  private getDirectoryName(contentType: ContentType): string {
    const directoryMap: Record<ContentType, string> = {
      ContentCategory: CONTENT_DIRECTORIES.CATEGORIES,
      Question: CONTENT_DIRECTORIES.QUESTIONS,
      KnowledgeBase: CONTENT_DIRECTORIES.KNOWLEDGE_BASE,
      PassageSet: CONTENT_DIRECTORIES.PASSAGES,
      StreakType: CONTENT_DIRECTORIES.STREAK_TYPES,
      UserState: CONTENT_DIRECTORIES.USER_STATES,
      AvatarAsset: CONTENT_DIRECTORIES.AVATAR_ASSETS,
      Achievement: CONTENT_DIRECTORIES.ACHIEVEMENTS,
      DailyChallenge: CONTENT_DIRECTORIES.DAILY_CHALLENGES
    };

    return directoryMap[contentType];
  }

  /**
   * Get content of a specific type
   */
  getContent<T extends ContentType>(contentType: T): Map<string, any> | undefined {
    if (!this.isInitialized) {
      throw new Error('Content loader not initialized. Call initialize() first.');
    }
    
    return this.contentMaps[contentType];
  }

  /**
   * Get all content maps
   */
  getContentMaps(): Partial<ContentMaps> {
    if (!this.isInitialized) {
      throw new Error('Content loader not initialized. Call initialize() first.');
    }
    
    return this.contentMaps;
  }

  /**
   * Get content by ID
   */
  getContentById<T extends ContentType>(contentType: T, id: string): any | undefined {
    const contentMap = this.getContent(contentType);
    return contentMap?.get(id);
  }

  /**
   * Get content by category
   */
  getContentByCategory<T extends ContentType>(
    contentType: T, 
    categoryId: string
  ): any[] | undefined {
    const contentMap = this.getContent(contentType);
    if (!contentMap) return undefined;

    const content = Array.from(contentMap.values());
    return content.filter(item => item.content_category_id === categoryId);
  }

  /**
   * Get all content of a specific type
   */
  getAllContent<T extends ContentType>(contentType: T): any[] | undefined {
    const contentMap = this.getContent(contentType);
    if (!contentMap) return undefined;

    return Array.from(contentMap.values());
  }

  /**
   * Check if content loader is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get content statistics
   */
  getContentStats(): Record<ContentType, number> {
    const stats: Record<ContentType, number> = {} as Record<ContentType, number>;
    
    for (const contentType of Object.keys(this.contentMaps) as ContentType[]) {
      const contentMap = this.contentMaps[contentType];
      stats[contentType] = contentMap ? contentMap.size : 0;
    }
    
    return stats;
  }

  /**
   * Reload content (useful for development)
   */
  async reload(): Promise<void> {
    this.isInitialized = false;
    this.contentMaps = {};
    await this.initialize();
  }
}

// Export singleton instance
export const contentLoader = new ContentLoader();
