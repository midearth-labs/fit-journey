import type { ILearningPathDAO } from '$lib/server/content/daos';

export interface ILearningPathHelper {
  /**
   * Given a list of learning path IDs, return only those IDS that exist, or null if none exists
   */
  filterValidLearningPaths(learningPathIds: string[]): string[] | null;
}

export class LearningPathHelper implements ILearningPathHelper {
  constructor(private readonly learningPathDAO: ILearningPathDAO) {}
filterValidLearningPaths(learningPathIds: string[]): string[] | null {
    if (!Array.isArray(learningPathIds) || learningPathIds.length === 0) {
      return null;
    }

    // BaseContentDAO provides getByIds which naturally filters non-existent IDs
    const validLearningPaths = this.learningPathDAO.getByIds(learningPathIds);
    
    if (validLearningPaths.length === 0) {
      return null;
    }

    return validLearningPaths.map(path => path.id);
  }
}


