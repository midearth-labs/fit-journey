// DAO Factory
// Creates appropriate DAO instances for each content type

import { Content } from '../types';
import { ContentCategoryDAO } from './daos/content-category-dao';
import { QuestionDAO } from './daos/question-dao';
import { KnowledgeBaseDAO } from './daos/knowledge-base-dao';
import { AvatarAssetDAO } from './daos/avatar-asset-dao';
import { StreakTypeDAO } from './daos/streak-type-dao';
import { ContentType } from '../types/constants';

export type ContentDaos = {
  ContentCategory: ContentCategoryDAO;
  Question: QuestionDAO;
  KnowledgeBase: KnowledgeBaseDAO;
  StreakType: StreakTypeDAO;
  AvatarAsset: AvatarAssetDAO;
};

export class ContentDAOFactory {
  private readonly daos: Readonly<ContentDaos>;

  constructor(daos: ContentDaos) {
    this.daos = daos;
  }

  /**
   * Initialize all DAOs
   */
  private static initializeDAOs(content: Content): ContentDaos {
    return {
      ContentCategory: new ContentCategoryDAO(content.ContentCategory),
      Question: new QuestionDAO(content.Question),
      KnowledgeBase: new KnowledgeBaseDAO(content.KnowledgeBase),
      StreakType: new StreakTypeDAO(content.StreakType),
      AvatarAsset: new AvatarAssetDAO(content.AvatarAsset),
    } satisfies Record<ContentType, any>;
  }

  /**
   * Get DAO for specific content type
   */
  getDAO(contentType: ContentType) {
    return this.daos[contentType];
  }

  /**
   * Get all available DAOs
   */
  getAllDAOs(): ContentDaos {
    return this.daos;
  }

  /**
   * Clear all DAO caches
   */
  clearAllCaches(): void {
    for (const dao of Object.values(this.daos)) {
      if (dao.clearCache) {
        dao.clearCache();
      }
    }
  }

  /**
   * Get cache statistics for all DAOs
   */
  getAllCacheStats(): Record<ContentType, any> {
    const stats: Record<ContentType, any> = {} as Record<ContentType, any>;

    for (const [contentType, dao] of Object.entries(this.daos)) {
      if (dao.getCacheStats) {
        stats[contentType as ContentType] = dao.getCacheStats();
      }
    }
    
    return stats;
  }
}
