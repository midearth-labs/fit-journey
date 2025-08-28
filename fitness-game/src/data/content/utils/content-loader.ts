// Content Loader Utility
// Handles loading and parsing of static content files

import { promises as fs } from 'fs';
import path from 'path';
import { ContentType, Content, LoadOptions, MapAndList } from '../types';
import { CONTENT_DIRECTORIES } from '../types/constants';

export class ContentLoader {
  private content: Content;
  private static contentBasePath: string = path.join(process.cwd(), 'src', 'data', 'content');

  constructor(content: Content) {
    this.content = content;
  }

  /**
   * Initialize the content loader by loading all content files
   */
  static async initialize(): Promise<ContentLoader> {
    try {
      return new ContentLoader(await this.loadAllContent());
    } catch (error) {
      console.error('Failed to initialize content loader:', error);
      throw new Error(`Content loader initialization failed: ${error}`);
    }
  }

  /**
   * Load all content files into memory
   */
  private static async loadAllContent(): Promise<Content> {
    try {
      return {
        ContentCategory: await this.loadContentType('ContentCategory'),
        Question: await this.loadContentType('Question'),
        KnowledgeBase: await this.loadContentType('KnowledgeBase'),
        PassageSet: await this.loadContentType('PassageSet'),
        StreakType: await this.loadContentType('StreakType'),
        AvatarAsset: await this.loadContentType('AvatarAsset'),
        DailyChallenge: await this.loadContentType('DailyChallenge')
      }
    } catch (error) {
      console.error(`Failed to load content`);
      throw error;
    }
  }

  /**
   * Load content of a specific type
   */
  private static async loadContentType<T extends ContentType>(contentType: T) {
    const directoryName = this.getDirectoryName(contentType);
    const directoryPath = path.join(this.contentBasePath, directoryName);
    console.debug(`Loading content type: ${contentType} from ${directoryPath}`);
    
    try {
      // Check if directory exists
      await fs.access(directoryPath);
    } catch {
      throw new Error(`Content ${contentType}: directory not found: ${directoryPath}`);
    }

    const files = await fs.readdir(directoryPath);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    if (jsonFiles.length === 0) {
      console.error(`Content ${contentType}: No JSON files found in ${directoryPath}`);
      // @TODO throw new Error(`Content ${contentType}: No JSON files found in ${directoryPath}`);
    }

    const contentMap: Content[T]['map'] = new Map();
    const contentList: Content[T]['list'] = [];
    
    for (const file of jsonFiles) {
      console.debug(`Loading content file: ${file} `);
      const filePath = path.join(directoryPath, file);
      
      const content = await this.loadContentFile(filePath);
      
      if (Array.isArray(content)) {
        // Handle array-based content files
        content.forEach((item, index) => {
          if (!(item && typeof item === 'object' && 'id' in item)) {
            throw new Error(`Content ${contentType}: Item is not an object with an id: ${filePath} at index ${index}`);
          }
          if (contentMap.has(item.id)) {
            throw new Error(`Content ${contentType}: Item with id ${item.id} already exists: ${filePath} at index ${index}`);
          }
          contentMap.set(item.id, item);
          contentList.push(item);
        });
      } else {
        throw new Error(`Content ${contentType}: File contents is not an array: ${filePath}`);
      }
    }

    return {
      map: contentMap,
      list: contentList
    };
  }

  /**
   * Load a single content file
   */
  private static async loadContentFile(filePath: string): Promise<any> {
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
  // @ TODO: Create a map of ContentType to replace CONTENT_DIRECTORIES
  private static getDirectoryName(contentType: ContentType): string {
    const directoryMap: Record<ContentType, string> = {
      ContentCategory: CONTENT_DIRECTORIES.CATEGORIES,
      Question: CONTENT_DIRECTORIES.QUESTIONS,
      KnowledgeBase: CONTENT_DIRECTORIES.KNOWLEDGE_BASE,
      PassageSet: CONTENT_DIRECTORIES.PASSAGES,
      StreakType: CONTENT_DIRECTORIES.STREAK_TYPES,
      AvatarAsset: CONTENT_DIRECTORIES.AVATAR_ASSETS,
      DailyChallenge: CONTENT_DIRECTORIES.DAILY_CHALLENGES
    };

    return directoryMap[contentType];
  }

  /**
   * Get content map of a specific type
   */
  getContentMap<T extends ContentType>(contentType: T) {
    return this.content[contentType].map;
  }

  /**
   * Get all content
   */
  getContent() {
    return this.content;
  }

  /**
   * Get content list of a specific type
   */
  getContentList<T extends ContentType>(contentType: T) {
    return this.content[contentType].list;
  }

  /**
   * Get content by ID
   */
  getContentById<T extends ContentType>(contentType: T, id: string) {
    const contentMap = this.getContentMap(contentType);
    return contentMap.get(id);
  }
}
