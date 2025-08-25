// Content Management System
// Main class that integrates content loading, validation, and distribution

import { ContentLoader } from './utils/content-loader';
import { ContentValidator } from './validation/content-validator';
import { ContentDistributor } from './utils/content-distributor';
import { ContentMaps, ValidationResult, ContentType } from './types';

export class ContentManagementSystem {
  private contentLoader: ContentLoader;
  private contentValidator: ContentValidator | null = null;
  private contentDistributor: ContentDistributor | null = null;
  private contentMaps: Partial<ContentMaps> = {};
  private isInitialized = false;
  private lastValidationResult: ValidationResult | null = null;

  constructor() {
    this.contentLoader = new ContentLoader();
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
      await this.contentLoader.initialize();
      this.contentMaps = this.contentLoader.getContentMaps();
      
      // Validate content
      await this.validateContent();
      
      // Initialize distributor
      this.contentDistributor = new ContentDistributor(this.contentMaps);
      
      this.isInitialized = true;
      console.log('Content Management System initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize Content Management System:', error);
      throw new Error(`Content Management System initialization failed: ${error}`);
    }
  }

  /**
   * Validate all content
   */
  async validateContent(): Promise<ValidationResult> {
    if (!this.contentMaps || Object.keys(this.contentMaps).length === 0) {
      throw new Error('No content loaded for validation');
    }

    console.log('Validating content...');
    
    this.contentValidator = new ContentValidator(this.contentMaps);
    const result = this.contentValidator.validateAllContent();
    
    this.lastValidationResult = result;
    
    if (result.isValid) {
      console.log('Content validation passed successfully');
    } else {
      console.error(`Content validation failed with ${result.errors.length} errors and ${result.warnings.length} warnings`);
      this.logValidationErrors(result);
    }
    
    return result;
  }

  /**
   * Get content by type
   */
  getContent<T extends ContentType>(contentType: T): any[] | undefined {
    this.ensureInitialized();
    return this.contentDistributor?.getContent(contentType);
  }

  /**
   * Get content by ID
   */
  getContentById<T extends ContentType>(contentType: T, id: string): any | undefined {
    this.ensureInitialized();
    return this.contentDistributor?.getContentById(contentType, id);
  }

  /**
   * Get content by category
   */
  getContentByCategory<T extends ContentType>(
    contentType: T, 
    categoryId: string,
    options?: any
  ): any[] | undefined {
    this.ensureInitialized();
    return this.contentDistributor?.getContentByCategory(contentType, categoryId, options);
  }

  /**
   * Get daily challenge by day
   */
  getDailyChallenge(day: number): any | undefined {
    this.ensureInitialized();
    return this.contentDistributor?.getDailyChallenge(day);
  }

  /**
   * Get next available daily challenge
   */
  getNextDailyChallenge(currentDay: number): any | undefined {
    this.ensureInitialized();
    return this.contentDistributor?.getNextDailyChallenge(currentDay);
  }

  /**
   * Get questions for a category with difficulty distribution
   */
  getQuestionsByCategory(
    categoryId: string, 
    count: number = 10,
    difficultyDistribution?: { easy: number; medium: number; hard: number }
  ): any[] | undefined {
    this.ensureInitialized();
    return this.contentDistributor?.getQuestionsByCategory(categoryId, count, difficultyDistribution);
  }

  /**
   * Get passage questions for a category
   */
  getPassageQuestionsByCategory(categoryId: string, count: number = 5): any[] | undefined {
    this.ensureInitialized();
    return this.contentDistributor?.getPassageQuestionsByCategory(categoryId, count);
  }

  /**
   * Get knowledge base articles for a category
   */
  getKnowledgeBaseByCategory(categoryId: string, count: number = 5): any[] | undefined {
    this.ensureInitialized();
    return this.contentDistributor?.getKnowledgeBaseByCategory(categoryId, count);
  }

  /**
   * Get achievements by category
   */
  getAchievementsByCategory(category?: string): any[] | undefined {
    this.ensureInitialized();
    return this.contentDistributor?.getAchievementsByCategory(category);
  }

  /**
   * Get user states ordered by evaluation order
   */
  getUserStatesOrdered(): any[] | undefined {
    this.ensureInitialized();
    return this.contentDistributor?.getUserStatesOrdered();
  }

  /**
   * Get avatar assets by state and demographics
   */
  getAvatarAssetsByState(
    stateId: string, 
    gender?: string, 
    ageRange?: string
  ): any[] | undefined {
    this.ensureInitialized();
    return this.contentDistributor?.getAvatarAssetsByState(stateId, gender, ageRange);
  }

  /**
   * Get streak types ordered by sort order
   */
  getStreakTypesOrdered(): any[] | undefined {
    this.ensureInitialized();
    return this.contentDistributor?.getStreakTypesOrdered();
  }

  /**
   * Search content by text
   */
  searchContent(
    contentType: ContentType,
    searchTerm: string,
    options?: any
  ): any[] | undefined {
    this.ensureInitialized();
    return this.contentDistributor?.searchContent(contentType, searchTerm, options);
  }

  /**
   * Get content statistics
   */
  getContentStats(): Record<ContentType, number> {
    this.ensureInitialized();
    return this.contentDistributor?.getContentStats() || {};
  }

  /**
   * Get category statistics
   */
  getCategoryStats(): Record<string, any> {
    this.ensureInitialized();
    return this.contentDistributor?.getCategoryStats() || {};
  }

  /**
   * Get validation result
   */
  getValidationResult(): ValidationResult | null {
    return this.lastValidationResult;
  }

  /**
   * Check if system is ready
   */
  isReady(): boolean {
    return this.isInitialized && this.lastValidationResult?.isValid === true;
  }

  /**
   * Reload content (useful for development)
   */
  async reload(): Promise<void> {
    console.log('Reloading content...');
    
    this.isInitialized = false;
    this.contentMaps = {};
    this.contentValidator = null;
    this.contentDistributor = null;
    this.lastValidationResult = null;
    
    await this.initialize();
  }

  /**
   * Clear content cache
   */
  clearCache(): void {
    this.contentDistributor?.clearCache();
  }

  /**
   * Get system health status
   */
  getSystemHealth(): {
    isInitialized: boolean;
    contentLoaded: boolean;
    validationPassed: boolean;
    contentStats: Record<ContentType, number>;
    validationErrors: number;
    validationWarnings: number;
  } {
    return {
      isInitialized: this.isInitialized,
      contentLoaded: Object.keys(this.contentMaps).length > 0,
      validationPassed: this.lastValidationResult?.isValid === true,
      contentStats: this.getContentStats(),
      validationErrors: this.lastValidationResult?.errors.length || 0,
      validationWarnings: this.lastValidationResult?.warnings.length || 0
    };
  }

  /**
   * Ensure system is initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('Content Management System not initialized. Call initialize() first.');
    }
  }

  /**
   * Log validation errors
   */
  private logValidationErrors(result: ValidationResult): void {
    console.error('=== Content Validation Errors ===');
    
    for (const error of result.errors) {
      console.error(`${error.entityType} ${error.entityId}: ${error.field} - ${error.message}`);
    }
    
    if (result.warnings.length > 0) {
      console.warn('=== Content Validation Warnings ===');
      for (const warning of result.warnings) {
        console.warn(`${warning.entityType} ${warning.entityId}: ${warning.field} - ${warning.message}`);
        if (warning.suggestion) {
          console.warn(`  Suggestion: ${warning.suggestion}`);
        }
      }
    }
    
    console.error(`Validation Summary: ${result.summary.totalEntities} total entities, ${result.summary.errorCount} errors, ${result.summary.warningCount} warnings`);
  }
}

// Export singleton instance
export const contentManagementSystem = new ContentManagementSystem();
