// Challenge DAO
// Extends base DAO for challenges with ordering logic

import { BaseContentDAO } from '../base-content-dao';
import { Challenge } from '../../types/challenge';

export class ChallengeDAO extends BaseContentDAO<Challenge> {
  /**
   * Get challenges ordered by sort order
   */
  getOrdered(): Challenge[] {
    return this.getAll().sort((a, b) => a.sort_order - b.sort_order);
  }

  /**
   * Validate that a challenge exists
   */
  validateChallengeExists(challengeId: string): boolean {
    return !!this.getById(challengeId);
  }

  /**
   * Get the duration of a challenge in days
   */
  getChallengeDuration(challengeId: string): number | null {
    return this.getById(challengeId)?.durationDays || null;
  }

  /**
   * Get all articles associated with a challenge
   */
  getChallengeArticles(challengeId: string): Challenge['articles'] | null {
    return this.getById(challengeId)?.articles || null;
  }

  /**
   * Get all habits associated with a challenge
   */
  getChallengeHabits(challengeId: string): Challenge['habits'] | null {
    return this.getById(challengeId)?.habits || null;
  }

  /**
   * Check if a knowledge base article is part of a challenge
   */
  isArticleInChallenge(challengeId: string, knowledgeBaseId: string): boolean {
    return this.getChallengeArticles(challengeId)?.
      some(article => article.knowledgeBaseId === knowledgeBaseId) || false;
  }
}
