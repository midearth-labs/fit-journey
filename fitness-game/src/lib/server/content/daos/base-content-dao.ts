// Base Content DAO
// Abstract base class providing common functionality for all content DAOs

import { type MapAndList } from "../types";

export type IBaseContentDAO<T> = {
  getAll(): T[];
  getById(id: string): T | undefined;
  getByIdOrThrow(id: string, errorProvider: () => Error): T;
  getByIds(ids: string[]): T[];
  getCount(): number;
  exists(id: string): boolean;
  getRandom(count: number): T[];
  clearCache(): void;
  getCacheStats(): { size: number; hits: number; misses: number };
};
  

export abstract class BaseContentDAO<T> implements IBaseContentDAO<T> {
  protected content: MapAndList<T>;
  private contentCache: Map<string, any> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  protected readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(content: MapAndList<T>) {
    this.content = content;
  }

  /**
   * Get all content of this type
   */
  getAll(): T[] {
    return this.content.list;
  }

  /**
   * Get content by ID
   */
  getById(id: string): T | undefined {
    const cacheKey = `id:${id}`;
    
    // Check cache first
    if (this.isCacheValid(cacheKey)) {
      return this.contentCache.get(cacheKey);
    }

    const content = this.content.map.get(id);
    
    // Cache the result
    if (content) {
      this.cacheContent(cacheKey, content);
    }

    return content;
  }

  /**
   * Get content by ID
   */
  getByIdOrThrow(id: string, errorProvider: () => Error): T {
    const content = this.getById(id);
    if (!content) {
      throw errorProvider();
    }
    return content;
  }

  /**
   * Get multiple items by IDs
   */
  getByIds(ids: string[]): T[] {
    return ids
      .map(id => this.getById(id))
      .filter((item): item is T => item !== undefined);
  }

  /**
   * Get content count
   */
  getCount(): number {
    return this.content.map.size;
  }

  /**
   * Check if content exists
   */
  exists(id: string): boolean {
    return this.content.map.has(id);
  }

  /**
   * Get random items
   */
  getRandom(count: number): T[] {
    return this.getRandomItems(this.getAll(), count);
  }

  /**
   * Clear content cache
   */
  clearCache(): void {
    this.contentCache.clear();
    this.cacheExpiry.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hits: number; misses: number } {
    return {
      size: this.contentCache.size,
      hits: 0, // Could implement hit tracking if needed
      misses: 0
    };
  }

  /**
   * Cache content with expiration
   */
  protected cacheContent(key: string, content: any): void {
    this.contentCache.set(key, content);
    this.cacheExpiry.set(key, Date.now() + this.CACHE_TTL);
  }

  /**
   * Check if cache is still valid
   */
  protected isCacheValid(key: string): boolean {
    const expiry = this.cacheExpiry.get(key);
    if (!expiry) return false;
    
    if (Date.now() > expiry) {
      this.contentCache.delete(key);
      this.cacheExpiry.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   */
  protected shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Get random items from an array
   */
  protected getRandomItems<T>(array: T[], count: number): T[] {
    if (count >= array.length) return array;
    
    const shuffled = this.shuffleArray(array);
    return shuffled.slice(0, count);
  }
}
