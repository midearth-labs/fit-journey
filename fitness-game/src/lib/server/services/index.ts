import type { IChallengeContentService } from './challenge-content.service';
import type { IChallengeService } from './challenge.service';

export { type IChallengeService, ChallengeService } from './challenge.service';
export { type IChallengeContentService, ChallengeContentService } from './challenge-content.service';

export type AuthServices = {
  challengeContentService: () => IChallengeContentService
  challengeService: () => IChallengeService
}