import type { ILogService } from './log.service';
import type { IUserProfileService } from './user-profile.service';
import type { IQuestionsService } from './questions.service';
import type { IModerationService } from './moderation.service';
import type { IAnswersService } from './answers.service';
import type { IProgressSharesService, IProgressSharesUnAuthenticatedService } from './progress-shares.service';
import type { IChallengesService } from './challenges.service';
import type { IArticleService } from './article.service';
export { type ILogService, LogService } from './log.service';
export { type IUserProfileService, UserProfileService } from './user-profile.service';
export { type IArticleService, ArticleService } from './article.service';

// Social Features Services
export { type IQuestionsService, QuestionsService } from './questions.service';
export { type IModerationService, ModerationService } from './moderation.service';
export { type IAnswersService, AnswersService } from './answers.service';
export { type IProgressSharesService, ProgressSharesService, type IProgressSharesUnAuthenticatedService, ProgressSharesUnAuthenticatedService } from './progress-shares.service';

export { type IChallengesService, ChallengesService } from './challenges.service';

export type AuthServices = {
  logService: () => ILogService
  userProfileService: () => IUserProfileService
  articleService: () => IArticleService
  questionsService: () => IQuestionsService
  answersService: () => IAnswersService
  progressSharesService: () => IProgressSharesService,
  challengesService: () => IChallengesService
}

export type UnAuthServices = {
  progressSharesUnAuthenticatedService: () => IProgressSharesUnAuthenticatedService
}