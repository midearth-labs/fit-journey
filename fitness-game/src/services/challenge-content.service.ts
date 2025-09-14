import { IChallengeDAO } from '@/data/content/utils/daos/';
import { Challenge } from '@/data/content/types/challenge';
import { AuthRequestContext } from '@/shared/interfaces';

export type IChallengeContentService = {
    getChallengeById(challengeId: string, requestContext: AuthRequestContext): Challenge;
    getAllChallenges(requestContext: AuthRequestContext): Challenge[];
  };

export class ChallengeContentService implements IChallengeContentService {
  constructor(private readonly challengeDAO: IChallengeDAO) {}

  /**
   * Get a challenge by its ID
   */
  getChallengeById(challengeId: string, _: AuthRequestContext): Challenge {
    const challenge = this.challengeDAO.getById(challengeId);
    if (!challenge) {
      throw new Error(`Challenge with ID ${challengeId} not found`);
    }
    return challenge;
  }

  /**
   * Get all available challenges
   */
  getAllChallenges(_: AuthRequestContext): Challenge[] {
    return this.challengeDAO.getOrdered();
  }

}
