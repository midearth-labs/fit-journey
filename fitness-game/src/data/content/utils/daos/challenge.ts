// Challenge DAO
// Extends base DAO for challenges with ordering logic

import { BaseContentDAO, IBaseContentDAO } from '../base-content-dao';
import { Challenge } from '../../types/challenge';

export type IChallengeDAO = IBaseContentDAO<Challenge> & {
  getOrdered(): Challenge[];
  getActiveChallengesOrdered(): Challenge[];
};
  

export class ChallengeDAO extends BaseContentDAO<Challenge> implements IChallengeDAO {
  /**
   * Get challenges ordered by sort order
   */
  getOrdered(): Challenge[] {
    return this.getAll().sort((a, b) => a.sort_order - b.sort_order);
  }

  /**
   * Get all active challenges
   */
  getActiveChallengesOrdered(): Challenge[] {
    return this.getOrdered().filter(challenge => challenge.is_active);
  }
}
