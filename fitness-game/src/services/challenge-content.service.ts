import { IChallengeDAO } from '@/data/content/utils/daos/';
import { Challenge } from '@/data/content/types/challenge';

export type IChallengeContentService = {
    getChallengeById(challengeId: string): Challenge;
    getAllChallenges(): Challenge[];
  };

export class ChallengeContentService implements IChallengeContentService {
  constructor(private readonly challengeDAO: IChallengeDAO) {}

  /**
   * Get a challenge by its ID
   */
  getChallengeById(challengeId: string): Challenge {
    const challenge = this.challengeDAO.getById(challengeId);
    if (!challenge) {
      throw new Error(`Challenge with ID ${challengeId} not found`);
    }
    return challenge;
  }

  /**
   * Get all available challenges
   */
  getAllChallenges(): Challenge[] {
    return this.challengeDAO.getOrdered();
  }

}
