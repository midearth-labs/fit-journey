// DAO Factory
// Creates appropriate DAO instances for each content type

import { type Content } from '../types';
import { ContentCategoryDAO } from './content-category-dao';
import { QuestionDAO } from './question-dao';
import { KnowledgeBaseDAO } from './knowledge-base-dao';
import { AvatarAssetDAO } from './avatar-asset-dao';
import { StreakTypeDAO } from './streak-type-dao';
import { type ContentType } from '../types/constants';
import { LearningPathDAO } from './learning-path-dao';
import { PersonaQuestionDAO } from './persona-question-dao';

export type ContentDaos = {
  ContentCategory: ContentCategoryDAO;
  Question: QuestionDAO;
  KnowledgeBase: KnowledgeBaseDAO;
  //StreakType: StreakTypeDAO;
  //AvatarAsset: AvatarAssetDAO;
  LearningPath: LearningPathDAO;
  PersonaQuestion: PersonaQuestionDAO;
};

export class ContentDAOFactory {
  private readonly daos: Readonly<ContentDaos>;

  private constructor(daos: ContentDaos) {
    this.daos = daos;
  }

  /**
   * Initialize all DAOs
   */
  public static initializeDAOs(content: Content): ContentDAOFactory  {
    return new ContentDAOFactory({
      ContentCategory: new ContentCategoryDAO(content.ContentCategory),
      Question: new QuestionDAO(content.Question),
      KnowledgeBase: new KnowledgeBaseDAO(content.KnowledgeBase),
      //StreakType: new StreakTypeDAO(content.StreakType),
      //AvatarAsset: new AvatarAssetDAO(content.AvatarAsset),
      LearningPath: new LearningPathDAO(content.LearningPath),
      PersonaQuestion: new PersonaQuestionDAO(content.PersonaQuestion),
    });
  }

  /**
   * Get DAO for specific content type
   */
  getDAO<T extends keyof ContentDaos>(contentType: T): ContentDaos[T] {
    return this.daos[contentType];
  }

  /**
   * Get all available DAOs
   */
  getAllDAOs(): ContentDaos {
    return this.daos;
  }

}
