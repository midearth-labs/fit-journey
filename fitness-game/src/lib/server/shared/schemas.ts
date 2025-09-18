import { z } from 'zod';
import {
  UuidSchema,
  EmailSchema,
  IsoDateSchema,
  TimeSchema,
  TimezoneSchema,
  DisplayNameSchema,
  CountryCodeSchema,
  AvatarGenderSchema,
  AvatarAgeRangeSchema,
  FiveStarValueSchema,
  YesNoValueSchema,
  DailyLogValueSchema,
  AllLogKeysSchema,
  NotificationPreferencesSchema
} from './z.primitives';

// --- User Profile Schemas ---

export const UpdateUserProfileDtoSchema = z.object({
  display_name: DisplayNameSchema.nullable().optional(),
  avatar_gender: AvatarGenderSchema.nullable().optional(),
  avatar_age_range: AvatarAgeRangeSchema.nullable().optional(),
  personalizationCountryCodes: z.array(CountryCodeSchema).min(1, 'At least one country code required').nullable().optional(),
  timezone: TimezoneSchema.nullable().optional(),
  preferred_reminder_time: TimeSchema.nullable().optional(),
  notification_preferences: NotificationPreferencesSchema.nullable().optional()
});

export const UserProfileResponseSchema = z.object({
  id: UuidSchema,
  email: EmailSchema.optional(),
  display_name: z.string().nullable(),
  avatar_gender: z.string().nullable(),
  avatar_age_range: z.string().nullable(),
  personalizationCountryCodes: z.array(z.string()).nullable(),
  timezone: z.string().nullable(),
  preferred_reminder_time: z.string().nullable(),
  notification_preferences: NotificationPreferencesSchema.nullable()
});

// --- Log Schemas ---

export const DailyLogPayloadSchema = z.object({
  dailyMovement: DailyLogValueSchema.optional(),
  cleanEating: DailyLogValueSchema.optional(),
  sleepQuality: DailyLogValueSchema.optional(),
  hydration: DailyLogValueSchema.optional()
}).refine(
  (data) => Object.keys(data).length > 0,
  'At least one log value must be provided'
);

export const PutUserLogDtoSchema = z.object({
  logDate: IsoDateSchema,
  values: DailyLogPayloadSchema
});

export const ListUserLogsQuerySchema = z.object({
  userChallengeId: UuidSchema.optional(),
  fromDate: IsoDateSchema.optional(),
  toDate: IsoDateSchema.optional()
}).refine(
  (data) => {
    if (data.fromDate && data.toDate) {
      return data.fromDate <= data.toDate;
    }
    return true;
  },
  'From date must be before or equal to to date'
);

export const UserLogResponseSchema = z.object({
  logDate: IsoDateSchema,
  values: z.record(z.string(), z.union([z.number(), z.null(), z.undefined()]))
});

// --- Challenge Schemas (for future use) ---

export const CreateUserChallengeDtoSchema = z.object({
  challengeId: UuidSchema,
  startDate: IsoDateSchema
});

export const UpdateUserChallengeScheduleDtoSchema = z.object({
  userChallengeId: UuidSchema,
  newStartDate: IsoDateSchema
});

export const UserAnswerSchema = z.object({
  question_id: UuidSchema,
  answer_index: z.number().int().min(0),
  is_correct: z.boolean(),
  hint_used: z.boolean()
});

export const SubmitUserChallengeQuizDtoSchema = z.object({
  userChallengeId: UuidSchema,
  knowledgeBaseId: UuidSchema,
  quizAnswers: z.array(UserAnswerSchema).min(1, 'At least one answer required'),
  overrideSubmission: z.boolean().optional()
});

export const ListUserChallengeQuizSubmissionsDtoSchema = z.object({
  userChallengeId: UuidSchema,
  fromDate: IsoDateSchema.optional(),
  toDate: IsoDateSchema.optional()
}).refine(
  (data) => {
    if (data.fromDate && data.toDate) {
      return data.fromDate <= data.toDate;
    }
    return true;
  },
  'From date must be before or equal to to date'
);

// Response schemas
export const NewUserChallengeResponseSchema = z.object({
  id: UuidSchema
});

export const UserChallengeSummaryResponseSchema = NewUserChallengeResponseSchema.extend({
  challengeId: UuidSchema,
  userId: UuidSchema,
  startDate: IsoDateSchema,
  originalStartDate: IsoDateSchema,
  status: z.enum(['not_started', 'active', 'completed', 'locked', 'inactive']),
  knowledgeBaseCompletedCount: z.number().int().min(0),
  dailyLogCount: z.number().int().min(0),
  lastActivityDate: IsoDateSchema.optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const UserChallengeDetailResponseSchema = UserChallengeSummaryResponseSchema;

export const UserChallengeProgressResponseSchema = z.object({
  id: UuidSchema,
  userChallengeId: UuidSchema,
  knowledgeBaseId: UuidSchema,
  allCorrectAnswers: z.boolean(),
  quizAnswers: z.array(UserAnswerSchema),
  firstAttemptedAt: z.string(),
  lastAttemptedAt: z.string(),
  attempts: z.number().int().min(1)
});

// Export inferred types for TypeScript usage
export type UpdateUserProfileDto = z.infer<typeof UpdateUserProfileDtoSchema>;
export type UserProfileResponse = z.infer<typeof UserProfileResponseSchema>;
export type PutUserLogDto = z.infer<typeof PutUserLogDtoSchema>;
export type ListUserLogsDto = z.infer<typeof ListUserLogsQuerySchema>;
export type UserLogResponse = z.infer<typeof UserLogResponseSchema>;
export type CreateUserChallengeDto = z.infer<typeof CreateUserChallengeDtoSchema>;
export type UpdateUserChallengeScheduleDto = z.infer<typeof UpdateUserChallengeScheduleDtoSchema>;
export type SubmitUserChallengeQuizDto = z.infer<typeof SubmitUserChallengeQuizDtoSchema>;
export type ListUserChallengeQuizSubmissionsDto = z.infer<typeof ListUserChallengeQuizSubmissionsDtoSchema>;
export type NewUserChallengeResponse = z.infer<typeof NewUserChallengeResponseSchema>;
export type UserChallengeSummaryResponse = z.infer<typeof UserChallengeSummaryResponseSchema>;
export type UserChallengeDetailResponse = z.infer<typeof UserChallengeDetailResponseSchema>;
export type UserChallengeProgressResponse = z.infer<typeof UserChallengeProgressResponseSchema>;
