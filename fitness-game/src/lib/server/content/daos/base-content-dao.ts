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
};
  

export abstract class BaseContentDAO<T> implements IBaseContentDAO<T> {
  protected content: MapAndList<T>;

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
    return this.content.map.get(id);
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
