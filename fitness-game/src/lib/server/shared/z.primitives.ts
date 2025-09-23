import { z } from 'zod';

// Common primitive schemas for reuse across all API schemas

export const UuidSchema = z.uuid();

export const EmailSchema = z.email().toLowerCase().trim();

export const IsoDateSchema = z.iso.date();

export const TimeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be in HH:MM format (24-hour)');

export const TimezoneSchema = z.string().min(1, 'Timezone cannot be empty').max(100, 'Timezone too long');

export const DisplayNameSchema = z.string().trim().min(1, 'Display name cannot be empty').max(80, 'Display name too long');

export const CountryCodeSchema = z.string().length(2, 'Country code must be exactly 2 characters').toUpperCase();

// Enum schemas matching database enums
export const AvatarGenderSchema = z.enum(['male', 'female']);

export const AvatarAgeRangeSchema = z.enum(['child', 'teen', 'young-adult', 'middle-age', 'senior']);

// Log value schemas - matching the database LogValueType<V extends number> = V | null | undefined
export const FiveStarValueSchema = z.union([
  z.literal(1),
  z.literal(2), 
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.null(),
  z.undefined()
]);

export const YesNoValueSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.null(),
  z.undefined()
]);

// For DailyLogPayload, only FiveStar values are allowed (1-5)
export const DailyLogValueSchema = FiveStarValueSchema;

// Log keys
export const AllLogKeysSchema = z.enum(['dailyMovement', 'cleanEating', 'sleepQuality', 'hydration']);

// Notification preferences schema
export const NotificationPreferencesSchema = z.object({
  daily: z.boolean(),
  social: z.boolean(),
  fitness_level: z.boolean()
});

// Social Features Enums
export const QuestionStatusSchema = z.enum(['pending', 'approved', 'rejected', 'hidden']);
export const AnswerStatusSchema = z.enum(['pending', 'approved', 'rejected', 'hidden']);
export const ReactionTypeSchema = z.enum(['helpful', 'not_helpful']);
export const EmojiReactionTypeSchema = z.enum(['clap', 'muscle', 'party']);
export const ShareTypeSchema = z.enum(['challenge_completion', 'avatar_progression', 'quiz_achievement', 'invitation_count']);
export const ShareStatusSchema = z.enum(['active', 'hidden']);
