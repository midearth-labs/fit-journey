// Achievement DAO
// Extends filterable DAO for achievements with category and difficulty logic

import { BaseContentDAO } from '../base-content-dao';
import { Achievement } from '../../types/achievement';

export class AchievementDAO extends BaseContentDAO <Achievement> {
}
