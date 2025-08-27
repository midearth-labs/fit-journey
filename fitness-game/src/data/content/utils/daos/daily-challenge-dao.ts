// Daily Challenge DAO
// Extends base DAO for daily challenges with day-based logic

import { BaseContentDAO } from '../base-content-dao';
import { DailyChallenge } from '../../types/daily-challenge';

export class DailyChallengeDAO extends BaseContentDAO<DailyChallenge> {
  /**
   * Get daily challenge by day number
   */
  getByDay(day: number): DailyChallenge | undefined {
    return this.getAll().find(challenge => challenge.day === day);
  }

  /**
   * Get next available daily challenge
   */
  getNext(currentDay: number): DailyChallenge | undefined {
    return this.getByDay(currentDay + 1);
  }

  /**
   * Get previous daily challenge
   */
  getPrevious(currentDay: number): DailyChallenge | undefined {
    return this.getByDay(currentDay - 1);
  }

}
