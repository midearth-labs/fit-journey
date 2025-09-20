import type { IChallengeContentService } from './challenge-content.service';
import type { IChallengeService } from './challenge.service';
import type { IChallengeProgressService } from './challenge-progress.service';
import type { ILogService } from './log.service';
import type { IUserProfileService } from './user-profile.service';
import type { IQuestionsService } from './questions.service';
import type { IModerationService } from './moderation.service';

export { type IChallengeService, ChallengeService } from './challenge.service';
export { type IChallengeContentService, ChallengeContentService } from './challenge-content.service';
export { type IChallengeProgressService, ChallengeProgressService } from './challenge-progress.service';
export { type ILogService, LogService } from './log.service';
export { type IUserProfileService, UserProfileService } from './user-profile.service';

// Social Features Services
export { type IQuestionsService, QuestionsService } from './questions.service';
export { type IModerationService, ModerationService } from './moderation.service';

export type AuthServices = {
  challengeContentService: () => IChallengeContentService
  challengeService: () => IChallengeService
  challengeProgressService: () => IChallengeProgressService
  logService: () => ILogService
  userProfileService: () => IUserProfileService
  questionsService: () => IQuestionsService
}