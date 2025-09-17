// StreakType type definition
// Based on entities.md StreakType entity

import { z } from 'zod';
import { BaseContentSchema } from './common';

export const HabitIdsSchema = z.enum([
  "dailyMovement",
  "cleanEating", 
  "sleepQuality",
  "hydration",
]);

export const StreakTypeSchema = BaseContentSchema.extend({
  id: HabitIdsSchema.or(z.enum([
    "quiz_completed",
    "quiz_passed",
    "all"
  ])),
  title: z.string(),

  /**
   * The type of data the user will log for this habit.
   * - 'boolean': A simple checkbox (done/not done).
   * - 'numeric': A number (e.g., minutes of exercise, glasses of water).
   * - 'text': A short text entry (e.g., "What I'm grateful for today").
   */
  type: z.enum(['weight_grams', '5star', 'yesno']),
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
