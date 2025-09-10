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
}
