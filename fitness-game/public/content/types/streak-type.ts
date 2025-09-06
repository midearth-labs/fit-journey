// StreakType type definition
// Based on entities.md StreakType entity

import { z } from 'zod';
import { BaseContentSchema } from './common';

export const StreakTypeSchema = BaseContentSchema.extend({
  id: z.enum([
    "workout_completed",
    "ate_clean", 
    "slept_well",
    "hydrated",
    "quiz_completed",
    "quiz_passed",
    "all"
  ]),
  title: z.string(),
  habit: z.string(),
  description: z.string(),
  health_benefits: z.array(z.string()),
  motivational_messages: z.array(z.object({
    short: z.string(),
    medium: z.string(), 
    long: z.string()
  }))
});

export type StreakType = z.infer<typeof StreakTypeSchema>;
