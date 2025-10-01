// Content Loader Utility
// Handles loading and parsing of static content files with Zod schema validation
// 
// Features:
// - Runtime validation using Zod schemas for each content type
// - Type-safe content loading with proper TypeScript inference
// - Detailed error messages for validation failures
// - Automatic schema selection based on content type

import { promises as fs } from 'fs';
import path from 'path';
import { type Content, ContentTypeToSchema } from '../types';
import { CONTENT_DIRECTORIES, type ContentType } from '../types/constants';
import z from 'zod';

export class ContentLoader {
  private content: Content;
  private static contentBasePath: string = path.join(process.cwd(), 'static', 'content');

  constructor(content: Content) {
    this.content = content;
  }

  /**
   * Initialize the content loader by loading all content files
   * Each content item is validated against its corresponding Zod schema
   * for runtime type safety and data integrity
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
        //StreakType: await this.loadContentType('StreakType'),
        //AvatarAsset: await this.loadContentType('AvatarAsset'),
        LearningPath: await this.loadContentType('LearningPath'),
        PersonaQuestion: await this.loadContentType('PersonaQuestion'),
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
    if (jsonFiles.length !== files.length) {
      console.warn(`Content ${contentType}: ${files.length - jsonFiles.length} non-JSON files found in ${directoryPath}`);
    }
    
    if (jsonFiles.length === 0) {
      // console.error(`Content ${contentType}: No JSON files found in ${directoryPath}`);
      throw new Error(`Content ${contentType}: No JSON files found in ${directoryPath}`);
    }

    const contentMap: Content[T]['map'] = new Map();
    const contentList: Content[T]['list'] = [];
    const arraySchema = z.array(ContentTypeToSchema[contentType]);
    
    for (const file of jsonFiles) {
      console.debug(`Loading content file: ${file} `);
      const filePath = path.join(directoryPath, file);
      const rawContent = await this.loadContentFile(filePath);

      try {
        const parsedContent = arraySchema.parse(rawContent instanceof Array ? rawContent : [rawContent]);
        parsedContent.forEach((item, index) => {
          if (contentMap.has(item.id)) {
            throw new Error(`Content ${contentType}: Item with id ${item.id} already exists: ${filePath} at index ${index}`);
          }
          
          contentMap.set(item.id, item);
          contentList.push(item);
        });
      } catch (validationError) {
        console.error(`Content ${contentType}: Validation failed in ${filePath}: ${validationError}`);
        throw validationError;
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
    return CONTENT_DIRECTORIES[contentType];
  }

  /**
   * Get content map of a specific type
   */
  getContentMap<T extends keyof Content>(contentType: T): Content[T]['map'] {
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
  getContentList<T extends keyof Content>(contentType: T): Content[T]['list'] {
    return this.content[contentType].list;
  }

  /**
   * Get content by ID
   */
  getContentById<T extends keyof Content>(contentType: T, id: string) {
    const contentMap = this.getContentMap(contentType);
    return contentMap.get(id);
  }
}
