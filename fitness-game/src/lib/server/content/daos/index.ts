// Export all DAO classes

export { ContentCategoryDAO } from './content-category-dao';
export { QuestionDAO } from './question-dao';
export { KnowledgeBaseDAO, type KnowledgeBaseDAO as IKnowledgeBaseDAO } from './knowledge-base-dao';
export { AvatarAssetDAO } from './avatar-asset-dao';
export { StreakTypeDAO } from './streak-type-dao';
export { type IChallengeDAO, ChallengeDAO } from './challenge';
export { ContentDAOFactory } from './dao-factory';