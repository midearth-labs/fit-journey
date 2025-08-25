// Content Distributor Utility
// Handles distribution and retrieval of validated content

import { ContentType, ContentMaps, LoadOptions } from '../types';
import { CONTENT_CATEGORIES, DIFFICULTY_LEVELS } from '../types/constants';

export class ContentDistributor {
  private contentMaps: Partial<ContentMaps> = {};
  private contentCache: Map<string, any> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(contentMaps: Partial<ContentMaps>) {
    this.contentMaps = contentMaps;
  }

  /**
   * Get content by type with optional filtering
   */
  getContent<T extends ContentType>(
    contentType: T, 
    options?: LoadOptions
  ): any[] | undefined {
    const contentMap = this.contentMaps[contentType];
    if (!contentMap) return undefined;

    let content = Array.from(contentMap.values());

    // Apply filters
    if (options) {
      content = this.applyFilters(content, options);
    }

    return content;
  }

  /**
   * Get content by ID
   */
  getContentById<T extends ContentType>(contentType: T, id: string): any | undefined {
    const cacheKey = `${contentType}:${id}`;
    
    // Check cache first
    if (this.isCacheValid(cacheKey)) {
      return this.contentCache.get(cacheKey);
    }

    const contentMap = this.contentMaps[contentType];
    if (!contentMap) return undefined;

    const content = contentMap.get(id);
    
    // Cache the result
    if (content) {
      this.cacheContent(cacheKey, content);
    }

    return content;
  }

  /**
   * Get content by category
   */
  getContentByCategory<T extends ContentType>(
    contentType: T, 
    categoryId: string,
    options?: LoadOptions
  ): any[] | undefined {
    const cacheKey = `${contentType}:category:${categoryId}`;
    
    // Check cache first
    if (this.isCacheValid(cacheKey)) {
      return this.contentCache.get(cacheKey);
    }

    const contentMap = this.contentMaps[contentType];
    if (!contentMap) return undefined;

    let content = Array.from(contentMap.values())
      .filter(item => item.content_category_id === categoryId);

    // Apply additional filters
    if (options) {
      content = this.applyFilters(content, options);
    }

    // Cache the result
    this.cacheContent(cacheKey, content);

    return content;
  }

  /**
   * Get daily challenge by day number
   */
  getDailyChallenge(day: number): any | undefined {
    const challenges = this.contentMaps.DailyChallenge;
    if (!challenges) return undefined;

    for (const [id, challenge] of challenges) {
      if (challenge.day === day) {
        return challenge;
      }
    }

    return undefined;
  }

  /**
   * Get next available daily challenge
   */
  getNextDailyChallenge(currentDay: number): any | undefined {
    const challenges = this.contentMaps.DailyChallenge;
    if (!challenges) return undefined;

    let nextChallenge: any | undefined;
    let nextDay = currentDay + 1;

    // Find the next available challenge
    while (!nextChallenge && nextDay <= 100) { // Reasonable upper limit
      for (const [id, challenge] of challenges) {
        if (challenge.day === nextDay) {
          nextChallenge = challenge;
          break;
        }
      }
      nextDay++;
    }

    return nextChallenge;
  }

  /**
   * Get questions for a specific category with difficulty distribution
   */
  getQuestionsByCategory(
    categoryId: string, 
    count: number = 10,
    difficultyDistribution?: { easy: number; medium: number; hard: number }
  ): any[] | undefined {
    const questions = this.getContentByCategory('Question', categoryId);
    if (!questions) return undefined;

    // Default difficulty distribution (3 easy, 4 medium, 3 hard)
    const distribution = difficultyDistribution || { easy: 3, medium: 4, hard: 3 };
    
    const easyQuestions = questions.filter(q => q.difficulty_level <= 2);
    const mediumQuestions = questions.filter(q => q.difficulty_level === 3);
    const hardQuestions = questions.filter(q => q.difficulty_level >= 4);

    const selectedQuestions: any[] = [];

    // Select questions based on difficulty distribution
    selectedQuestions.push(...this.getRandomItems(easyQuestions, distribution.easy));
    selectedQuestions.push(...this.getRandomItems(mediumQuestions, distribution.medium));
    selectedQuestions.push(...this.getRandomItems(hardQuestions, distribution.hard));

    // Shuffle the questions
    return this.shuffleArray(selectedQuestions);
  }

  /**
   * Get passage-based questions for a specific category
   */
  getPassageQuestionsByCategory(categoryId: string, count: number = 5): any[] | undefined {
    const passages = this.getContentByCategory('PassageSet', categoryId);
    if (!passages) return undefined;

    const questions = this.getContentByCategory('Question', categoryId);
    if (!questions) return undefined;

    const passageQuestions: any[] = [];
    const selectedPassages = this.getRandomItems(passages, Math.min(count, passages.length));

    for (const passage of selectedPassages) {
      const passageQuestions = questions.filter(q => q.passage_set_id === passage.id);
      if (passageQuestions.length > 0) {
        passageQuestions.push(...passageQuestions);
      }
    }

    return this.shuffleArray(passageQuestions).slice(0, count);
  }

  /**
   * Get knowledge base articles for a specific category
   */
  getKnowledgeBaseByCategory(categoryId: string, count: number = 5): any[] | undefined {
    const knowledgeBase = this.getContentByCategory('KnowledgeBase', categoryId);
    if (!knowledgeBase) return undefined;

    return this.getRandomItems(knowledgeBase, Math.min(count, knowledgeBase.length));
  }

  /**
   * Get achievements by category
   */
  getAchievementsByCategory(category?: string): any[] | undefined {
    const achievements = this.contentMaps.Achievement;
    if (!achievements) return undefined;

    let content = Array.from(achievements.values());

    if (category) {
      content = content.filter(achievement => achievement.category === category);
    }

    return content;
  }

  /**
   * Get user states ordered by evaluation order
   */
  getUserStatesOrdered(): any[] | undefined {
    const userStates = this.contentMaps.UserState;
    if (!userStates) return undefined;

    const states = Array.from(userStates.values());
    return states.sort((a, b) => a.eval_order - b.eval_order);
  }

  /**
   * Get avatar assets by state and demographics
   */
  getAvatarAssetsByState(
    stateId: string, 
    gender?: string, 
    ageRange?: string
  ): any[] | undefined {
    const avatarAssets = this.contentMaps.AvatarAsset;
    if (!avatarAssets) return undefined;

    let assets = Array.from(avatarAssets.values())
      .filter(asset => asset.state_id === stateId);

    if (gender) {
      assets = assets.filter(asset => asset.gender === gender);
    }

    if (ageRange) {
      assets = assets.filter(asset => asset.age_range === ageRange);
    }

    return assets;
  }

  /**
   * Get streak types ordered by sort order
   */
  getStreakTypesOrdered(): any[] | undefined {
    const streakTypes = this.contentMaps.StreakType;
    if (!streakTypes) return undefined;

    const types = Array.from(streakTypes.values());
    return types.sort((a, b) => a.sort_order - b.sort_order);
  }

  /**
   * Search content by text
   */
  searchContent(
    contentType: ContentType,
    searchTerm: string,
    options?: LoadOptions
  ): any[] | undefined {
    const content = this.getContent(contentType, options);
    if (!content) return undefined;

    const term = searchTerm.toLowerCase();
    return content.filter(item => {
      // Search in text fields
      if (item.name && item.name.toLowerCase().includes(term)) return true;
      if (item.description && item.description.toLowerCase().includes(term)) return true;
      if (item.question_text && item.question_text.toLowerCase().includes(term)) return true;
      if (item.passage_text && item.passage_text.toLowerCase().includes(term)) return true;
      if (item.title && item.title.toLowerCase().includes(term)) return true;
      
      // Search in tags
      if (item.tags && item.tags.some((tag: string) => tag.toLowerCase().includes(term))) return true;
      
      return false;
    });
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
   * Get category statistics
   */
  getCategoryStats(): Record<string, any> {
    const categories = this.contentMaps.ContentCategory;
    if (!categories) return {};

    const stats: Record<string, any> = {};

    for (const [id, category] of categories) {
      const questionCount = this.getContentByCategory('Question', id)?.length || 0;
      const passageCount = this.getContentByCategory('PassageSet', id)?.length || 0;
      const knowledgeCount = this.getContentByCategory('KnowledgeBase', id)?.length || 0;

      stats[id] = {
        name: category.name,
        questionCount,
        passageCount,
        knowledgeCount,
        totalContent: questionCount + passageCount + knowledgeCount
      };
    }

    return stats;
  }

  /**
   * Clear content cache
   */
  clearCache(): void {
    this.contentCache.clear();
    this.cacheExpiry.clear();
  }

  /**
   * Apply filters to content
   */
  private applyFilters(content: any[], options: LoadOptions): any[] {
    let filtered = content;

    if (options.categoryId) {
      filtered = filtered.filter(item => item.content_category_id === options.categoryId);
    }

    if (options.difficultyLevel !== undefined) {
      filtered = filtered.filter(item => item.difficulty_level === options.difficultyLevel);
    }

    if (options.isActive !== undefined) {
      filtered = filtered.filter(item => item.is_active === options.isActive);
    }

    if (options.limit) {
      filtered = filtered.slice(0, options.limit);
    }

    if (options.offset) {
      filtered = filtered.slice(options.offset);
    }

    return filtered;
  }

  /**
   * Get random items from an array
   */
  private getRandomItems<T>(array: T[], count: number): T[] {
    if (count >= array.length) return array;
    
    const shuffled = this.shuffleArray([...array]);
    return shuffled.slice(0, count);
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Cache content with expiration
   */
  private cacheContent(key: string, content: any): void {
    this.contentCache.set(key, content);
    this.cacheExpiry.set(key, Date.now() + this.CACHE_TTL);
  }

  /**
   * Check if cache is still valid
   */
  private isCacheValid(key: string): boolean {
    const expiry = this.cacheExpiry.get(key);
    if (!expiry) return false;
    
    if (Date.now() > expiry) {
      this.contentCache.delete(key);
      this.cacheExpiry.delete(key);
      return false;
    }
    
    return true;
  }
}
