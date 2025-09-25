
import type { IChallengeProgressService } from './challenge-progress.service';
import type { ILogService } from './log.service';
import type { IUserProfileService } from './user-profile.service';
import type { IQuestionsService } from './questions.service';
import type { IModerationService } from './moderation.service';
import type { IAnswersService } from './answers.service';
import type { IProgressSharesService, IProgressSharesUnAuthenticatedService } from './progress-shares.service';
import type { IChallengesService } from './challenges.service';

export { type IChallengeProgressService, ChallengeProgressService } from './challenge-progress.service';
export { type ILogService, LogService } from './log.service';
export { type IUserProfileService, UserProfileService } from './user-profile.service';

// Social Features Services
export { type IQuestionsService, QuestionsService } from './questions.service';
export { type IModerationService, ModerationService } from './moderation.service';
export { type IAnswersService, AnswersService } from './answers.service';
export { type IProgressSharesService, ProgressSharesService, type IProgressSharesUnAuthenticatedService, ProgressSharesUnAuthenticatedService } from './progress-shares.service';

export { type IChallengesService, ChallengesService } from './challenges.service';

export type AuthServices = {
  challengeProgressService: () => IChallengeProgressService
  logService: () => ILogService
  userProfileService: () => IUserProfileService
  questionsService: () => IQuestionsService
  answersService: () => IAnswersService
  progressSharesService: () => IProgressSharesService,
  challengesService: () => IChallengesService
}

export type UnAuthServices = {
  progressSharesUnAuthenticatedService: () => IProgressSharesUnAuthenticatedService
}