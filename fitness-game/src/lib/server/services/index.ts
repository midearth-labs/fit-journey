import type { IChallengeContentService } from './challenge-content.service';
import type { IChallengeService } from './challenge.service';
import type { ILogService } from './log.service';

export { type IChallengeService, ChallengeService } from './challenge.service';
export { type IChallengeContentService, ChallengeContentService } from './challenge-content.service';
export { type ILogService, LogService } from './log.service';

export type AuthServices = {
  challengeContentService: () => IChallengeContentService
  challengeService: () => IChallengeService
  logService: () => ILogService
}