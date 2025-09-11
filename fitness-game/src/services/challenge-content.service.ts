import { ChallengeDAO } from '@/data/content/utils/daos/challenge';
import { IChallengeContentService } from '@/shared/interfaces';
import { Challenge } from '@/data/content/types/challenge';

export class ChallengeContentService implements IChallengeContentService {
  constructor(private readonly challengeDAO: ChallengeDAO) {}

  /**
   * Get a challenge by its ID
   */
  async getChallengeById(challengeId: string): Promise<Challenge> {
    const challenge = this.challengeDAO.getById(challengeId);
    if (!challenge) {
      throw new Error(`Challenge with ID ${challengeId} not found`);
    }
    return challenge;
  }

  /**
   * Get all available challenges
   */
  async getAllChallenges(): Promise<Challenge[]> {
    return this.challengeDAO.getOrdered();
  }

  /**
   * Validate that a challenge exists
   */
  async validateChallengeExists(challengeId: string): Promise<boolean> {
    return this.challengeDAO.validateChallengeExists(challengeId);
  }

  /**
   * Get the duration of a challenge in days
   */
  getChallengeDuration(challengeId: string): number | null {
    return this.challengeDAO.getChallengeDuration(challengeId);
  }

  /**
   * Get all articles associated with a challenge
   */
  getChallengeArticles(challengeId: string): any[] | null {
    return this.challengeDAO.getChallengeArticles(challengeId);
  }

  /**
   * Get all habits associated with a challenge
   */
  getChallengeHabits(challengeId: string): any[] | null {
    return this.challengeDAO.getChallengeHabits(challengeId);
  }

  /**
   * Check if a knowledge base article is part of a challenge
   */
  isArticleInChallenge(challengeId: string, knowledgeBaseId: string): boolean {
    return this.challengeDAO.isArticleInChallenge(challengeId, knowledgeBaseId);
  }
}
