import { ChallengeDAO, type IChallengeDAO } from '$lib/server/content/daos';
import { type Challenge } from '$lib/server/content/types/challenge';
import { type AuthRequestContext } from '$lib/server/shared/interfaces';
import { type ServiceCreatorFromDependencies, type ServiceCreatorFromRequestContext } from './shared';

export type IChallengeContentService = {
    getChallengeById(dto: {challengeId: string}): Challenge;
    listAllChallenges(dto: {}): Challenge[];
};

export class ChallengeContentService implements IChallengeContentService {
  constructor(
    private readonly dependencies: { readonly challengeDAO: IChallengeDAO; },
    private readonly authRequestContext: AuthRequestContext
  ) {}

  /**
   * Get a challenge by its ID
   */
  getChallengeById(dto: {challengeId: string}): Challenge {
    const { challengeDAO } = this.dependencies;
    const challenge = challengeDAO.getById(dto.challengeId);
    if (!challenge) {
      throw new Error(`Challenge with ID ${dto.challengeId} not found`);
    }
    return challenge;
  }

  /**
   * List all available challenges
   */
  listAllChallenges(): Challenge[] {
    const { challengeDAO } = this.dependencies;
    return challengeDAO.getOrdered();
  }

}
