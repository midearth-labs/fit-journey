import { type IChallengeDAO } from '$lib/server/content/daos';
import { type Challenge } from '$lib/server/content/types/challenge';
import { type AuthRequestContext } from '$lib/server/shared/interfaces';

export type IChallengeContentService = {
    getChallengeById(dto: {challengeId: string}, requestContext: AuthRequestContext): Challenge;
    getAllChallenges(dto: {}, requestContext: AuthRequestContext): Challenge[];
  };

export class ChallengeContentService implements IChallengeContentService {
  constructor(private readonly challengeDAO: IChallengeDAO) {}

  /**
   * Get a challenge by its ID
   */
  getChallengeById(dto: {challengeId: string}, _: AuthRequestContext): Challenge {
    const challenge = this.challengeDAO.getById(dto.challengeId);
    if (!challenge) {
      throw new Error(`Challenge with ID ${dto.challengeId} not found`);
    }
    return challenge;
  }

  /**
   * Get all available challenges
   */
  getAllChallenges(_: {}, __: AuthRequestContext): Challenge[] {
    return this.challengeDAO.getOrdered();
  }

}
