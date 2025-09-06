// Avatar Asset DAO
// Extends filterable DAO for avatar assets with state and demographic filtering

import { BaseContentDAO } from '../base-content-dao';
import { AvatarAsset } from '../../types/avatar-asset';

export class AvatarAssetDAO extends BaseContentDAO<AvatarAsset> {
  /**
   * Get avatar assets by age range
   */
  getByAgeRangeAndGender(ageRange: string, gender: string): AvatarAsset[] {
    return this.getAll().filter(asset => asset.age_range === ageRange && asset.gender === gender);
  }

}
