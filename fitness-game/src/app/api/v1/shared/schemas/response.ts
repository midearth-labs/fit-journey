import { z } from 'zod';
import { UUIDSchema, ISOSchema, ChallengeStatusSchema, UserAnswerSchema, DailyHabitLogPayloadSchema } from './common';

// Base response schemas
export const BaseResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});

export const ErrorResponseSchema = BaseResponseSchema.extend({
  success: z.literal(false),
  error: z.string(),
  details: z.any().optional(),
});

// Challenge Content Service Response Schemas

export const ChallengeResponseSchema = z.object({
  id: UUIDSchema,
  name: z.string(),
  description: z.string(),
  durationDays: z.number().int().positive(),
  articles: z.array(z.object({
    knowledgeBaseId: UUIDSchema,
    suggestedDay: z.number().int().positive(),
  })),
  habits: z.array(z.string()),
});

export const ChallengeListResponseSchema = z.array(ChallengeResponseSchema);

// Challenge Service Response Schemas

export const NewUserChallengeResponseSchema = z.object({
  id: UUIDSchema,
});

export const UserChallengeSummaryResponseSchema = NewUserChallengeResponseSchema.extend({
  challengeId: UUIDSchema,
  userId: UUIDSchema,
  startDate: z.string(),
  originalStartDate: z.string(),
  status: ChallengeStatusSchema,
  knowledgeBaseCompletedCount: z.number().int().min(0),
  habitsLoggedCount: z.number().int().min(0),
  lastActivityDate: ISOSchema.optional(),
  createdAt: ISOSchema,
  updatedAt: ISOSchema,
});

// UserChallengeDetailResponse extends UserChallengeSummaryResponse
export const UserChallengeDetailResponseSchema = UserChallengeSummaryResponseSchema;

export const UserChallengeListResponseSchema = z.array(UserChallengeSummaryResponseSchema);

export const UserHabitLogResponseSchema = z.object({
  id: UUIDSchema,
  userChallengeId: UUIDSchema,
  logDate: z.string(),
  values: DailyHabitLogPayloadSchema,
  createdAt: ISOSchema,
  updatedAt: ISOSchema,
});

export const UserHabitLogListResponseSchema = z.array(UserHabitLogResponseSchema);

export const UserChallengeProgressResponseSchema = z.object({
  id: UUIDSchema,
  userChallengeId: UUIDSchema,
  knowledgeBaseId: UUIDSchema,
  allCorrectAnswers: z.boolean(),
  quizAnswers: z.array(UserAnswerSchema),
  firstAttemptedAt: ISOSchema,
  lastAttemptedAt: ISOSchema,
  attempts: z.number().int().min(0),
});

export const UserChallengeProgressListResponseSchema = z.array(UserChallengeProgressResponseSchema);

// API Response wrappers
export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  BaseResponseSchema.extend({
    success: z.literal(true),
    data: dataSchema,
  });

// Specific API response schemas
export const ChallengeApiResponseSchema = ApiResponseSchema(ChallengeResponseSchema);
export const ChallengeListApiResponseSchema = ApiResponseSchema(ChallengeListResponseSchema);
export const NewUserChallengeApiResponseSchema = ApiResponseSchema(NewUserChallengeResponseSchema);
export const UserChallengeDetailApiResponseSchema = ApiResponseSchema(UserChallengeDetailResponseSchema);
export const UserChallengeListApiResponseSchema = ApiResponseSchema(UserChallengeListResponseSchema);
export const UserHabitLogListApiResponseSchema = ApiResponseSchema(UserHabitLogListResponseSchema);
export const UserChallengeProgressListApiResponseSchema = ApiResponseSchema(UserChallengeProgressListResponseSchema);
export const EmptyApiResponseSchema = ApiResponseSchema(z.object({}));
