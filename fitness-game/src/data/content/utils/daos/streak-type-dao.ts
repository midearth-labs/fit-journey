// Streak Type DAO
// Extends base DAO for streak types with ordering logic

import { BaseContentDAO } from '../base-content-dao';
import { StreakType } from '../../types/streak-type';

export class StreakTypeDAO extends BaseContentDAO<StreakType> {
  /**
   * Get streak types ordered by sort order
   */
  getOrdered(): StreakType[] {
    return this.getAll().sort((a, b) => a.sort_order - b.sort_order);
  }
}
