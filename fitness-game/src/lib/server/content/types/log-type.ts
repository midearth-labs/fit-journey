// StreakType type definition
// Based on entities.md StreakType entity

import { z } from 'zod';
import { BaseContentSchema } from './common';
import { AllLogKeys } from '$lib/server/db/schema';

export const LoggingKeysSchema = z.enum(AllLogKeys);

export const MeasurementUnitsSchema = z.enum([
  "kgs",
]);

export const LogTypeSchema = BaseContentSchema.extend({
  id: LoggingKeysSchema,
  title: z.string(),

  /**
   * The type of data the user will log for this habit. The underlying value is always a number.
   * - 'yesno': A simple checkbox (done/not done).
   * - '5star': A number (e.g., minutes of exercise, glasses of water).
   * - 'yesno': A short text entry (e.g., "What I'm grateful for today").
   */
  type: z.discriminatedUnion("type", [
    z.object({ type: z.literal("float"), min: z.number().optional(), max: z.number().optional(), unit: MeasurementUnitsSchema.optional() }),
    z.object({ type: z.literal("integer"), min: z.number().optional(), max: z.number().optional(), unit: MeasurementUnitsSchema.optional() }),
    z.object({ type: z.literal("5star") }),
    z.object({ type: z.literal("yesno") }),
  ]),
  display_title: z.string(),
  description: z.string(),
  health_benefits: z.array(z.string()),
  motivational_messages: z.array(z.object({
    short: z.string(),
    medium: z.string(), 
    long: z.string()
  })).min(1).max(3)
});

export type LogType = z.infer<typeof LogTypeSchema>;
