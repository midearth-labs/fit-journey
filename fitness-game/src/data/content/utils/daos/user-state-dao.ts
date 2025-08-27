// User State DAO
// Extends base DAO for user states with ordering logic

import { BaseContentDAO } from '../base-content-dao';
import { UserState } from '../../types/user-state';

export class UserStateDAO extends BaseContentDAO<UserState> {
}
