// AvatarAsset type definition
// Based on entities.md AvatarAsset entity

import { z } from 'zod';
import { BaseContentSchema, ImageSchema } from './common';

export const AvatarAssetSchema = BaseContentSchema.extend({
  // @TODO: Add validation for uniqueness of gender and age_range combination. Also that url of all images across all fitness levels across the entire dataset are unique.
  gender: z.enum(["male", "female"]),
  fitness_levels: z.record(
    z.enum(["-5", "-4", "-3", "-2", "-1", "0", "1", "2", "3", "4", "5"]),
    ImageSchema
  ),
  age_range: z.enum(["child", "teen", "young-adult", "middle-age", "senior"]),
});

// @TODO: check whats up with the Partial record on fitness_levels
export type AvatarAsset = z.infer<typeof AvatarAssetSchema>;
