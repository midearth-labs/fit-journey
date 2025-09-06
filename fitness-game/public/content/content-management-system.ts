// Content Management System
// Main class that integrates content loading, validation, and distribution

import { ContentLoader } from './utils/content-loader';

export class ContentManagementSystem {
  private contentLoader: ContentLoader | null = null;
  private isInitialized = false;

  constructor() {
  }

  /**
   * Initialize the content management system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('Initializing Content Management System...');
      
      // Load all content
      this.contentLoader = await ContentLoader.initialize();
      
      this.isInitialized = true;
      console.log('Content Management System initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize Content Management System:', error);
      throw new Error(`Content Management System initialization failed: ${error}`);
    }
  }

  /**
   * Reload content (useful for development)
   */
  async reload(): Promise<void> {
    console.log('Reloading content...');
    
    this.isInitialized = false;
    this.contentLoader = null;
    
    await this.initialize();
  }

  /**
   * Ensure system is initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('Content Management System not initialized. Call initialize() first.');
    }
  }
}

