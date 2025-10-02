// Streak Type DAO
// Extends base DAO for streak types with ordering logic

import { BaseContentDAO } from './base-content-dao';
import { type LogType } from '../types/log-type';

export class StreakTypeDAO extends BaseContentDAO<LogType> {
  /**
   * Get streak types ordered by sort order
   */
  getOrdered(): LogType[] {
    return this.getAll().sort((a, b) => a.sort_order - b.sort_order);
  }
}
