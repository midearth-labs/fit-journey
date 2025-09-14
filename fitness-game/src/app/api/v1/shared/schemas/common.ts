import { z } from 'zod';

// Common schemas that are reused across multiple endpoints

export const UUIDSchema = z.string().uuid();

export const DateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

export const ISOSchema = z.string().datetime();

// Auth context schema
export const AuthRequestContextSchema = z.object({
  requestDate: z.date(),
  userId: z.string().uuid(),
});

// User answer schema (from database schema)
export const UserAnswerSchema = z.object({
  question_id: z.string(),
  answer_index: z.number().int().min(0),
  is_correct: z.boolean(),
  hint_used: z.boolean(),
});

// Daily habit log payload schema (from database schema)
export const DailyHabitLogPayloadSchema = z.object({
  workout_completed: z.boolean().optional(),
  ate_clean: z.boolean().optional(),
  slept_well: z.boolean().optional(),
  hydrated: z.boolean().optional(),
});

// Challenge status enum
export const ChallengeStatusSchema = z.enum([
  'not_started',
  'active', 
  'completed',
  'locked',
  'inactive'
]);

// Habit type enum
export const HabitTypeSchema = z.enum([
  'workout_completed',
  'ate_clean',
  'slept_well',
  'hydrated'
]);

// Quiz type enum
export const QuizTypeSchema = z.enum([
  'quiz_completed',
  'quiz_passed'
]);

// Streak type enum
export const StreakTypeSchema = z.enum([
  'workout_completed',
  'ate_clean',
  'slept_well',
  'hydrated',
  'quiz_completed',
  'quiz_passed',
  'all'
]);
