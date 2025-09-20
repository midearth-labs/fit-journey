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
  DailyLogValueSchema,
  NotificationPreferencesSchema,
  QuestionStatusSchema,
  AnswerStatusSchema,
  ReactionTypeSchema,
  EmojiReactionTypeSchema,
  ShareTypeSchema,
  ShareStatusSchema
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

// --- Social Features Schemas ---

// Question Schemas
export const SubmitQuestionDtoSchema = z.object({
  articleIds: z.array(z.string().min(1, 'Article ID cannot be empty')).min(1, 'At least one article ID required'),
  title: z.string().trim().min(10, 'Title must be at least 10 characters').max(100, 'Title must be no more than 100 characters'),
  body: z.string().trim().min(10, 'Body must be at least 10 characters').max(2000, 'Body must be no more than 2000 characters'),
  isAnonymous: z.boolean().default(false)
});

export const ListQuestionsQuerySchema = z.object({
  articleId: z.string().min(1, 'Article ID cannot be empty'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export const GetQuestionParamsSchema = z.object({
  questionId: UuidSchema
});

export const QuestionResponseSchema = z.object({
  id: UuidSchema,
  title: z.string(),
  body: z.string(),
  status: QuestionStatusSchema,
  helpfulCount: z.number().int().min(0),
  notHelpfulCount: z.number().int().min(0),
  createdAt: z.string(),
  updatedAt: z.string(),
  userId: UuidSchema.nullable()
});

// Answer Schemas
export const SubmitAnswerDtoSchema = z.object({
  questionId: UuidSchema,
  answer: z.string().trim().min(10, 'Answer must be at least 10 characters').max(2000, 'Answer must be no more than 2000 characters'),
  isAnonymous: z.boolean().default(false)
});

export const ListAnswersQuerySchema = z.object({
  questionId: UuidSchema,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export const GetAnswerParamsSchema = z.object({
  questionId: UuidSchema,
  answerId: UuidSchema
});

export const AnswerResponseSchema = z.object({
  id: UuidSchema,
  answer: z.string(),
  status: AnswerStatusSchema,
  helpfulCount: z.number().int().min(0),
  notHelpfulCount: z.number().int().min(0),
  createdAt: z.string(),
  userId: UuidSchema.nullable()
});

// Reaction Schemas
export const AddReactionDtoSchema = z.object({
  questionId: UuidSchema,
  reactionType: ReactionTypeSchema
});

export const AddAnswerReactionDtoSchema = z.object({
  questionId: UuidSchema,
  answerId: UuidSchema,
  reactionType: ReactionTypeSchema
});

// Share Schemas
export const ShareProgressDtoSchema = z.object({
  shareType: ShareTypeSchema,
  shareTypeId: z.string().min(1, 'Share type ID cannot be empty').optional(),
  includeInviteLink: z.boolean().default(false),
  isPublic: z.boolean().default(true)
});

export const AddShareReactionDtoSchema = z.object({
  shareId: UuidSchema,
  reactionType: EmojiReactionTypeSchema
});

export const ProgressShareResponseSchema = z.object({
  id: UuidSchema,
  shareType: ShareTypeSchema,
  shareTypeId: z.string(),
  contentVersion: z.string(),
  generatedContent: z.object({
    title: z.string(),
    message: z.string(),
    stats: z.record(z.string(), z.any()),
    image: z.string().optional()
  }),
  includeInviteLink: z.boolean(),
  isPublic: z.boolean(),
  status: ShareStatusSchema,
  clapCount: z.number().int().min(0),
  muscleCount: z.number().int().min(0),
  partyCount: z.number().int().min(0),
  createdAt: z.string(),
  userId: UuidSchema
});

// Invitation Schemas
export const InviteStatsResponseSchema = z.object({
  invitationCode: UuidSchema,
  invitationLink: z.string().url(),
  invitationJoinCount: z.number().int().min(0)
});

// Export inferred types
export type SubmitQuestionDto = z.infer<typeof SubmitQuestionDtoSchema>;
export type ListQuestionsDto = z.infer<typeof ListQuestionsQuerySchema>;
export type GetQuestionDto = z.infer<typeof GetQuestionParamsSchema>;
export type QuestionResponse = z.infer<typeof QuestionResponseSchema>;
export type SubmitAnswerDto = z.infer<typeof SubmitAnswerDtoSchema>;
export type ListAnswersDto = z.infer<typeof ListAnswersQuerySchema>;
export type AnswerResponse = z.infer<typeof AnswerResponseSchema>;
export type AddReactionDto = z.infer<typeof AddReactionDtoSchema>;
export type AddAnswerReactionDto = z.infer<typeof AddAnswerReactionDtoSchema>;
export type ShareProgressDto = z.infer<typeof ShareProgressDtoSchema>;
export type AddShareReactionDto = z.infer<typeof AddShareReactionDtoSchema>;
export type ProgressShareResponse = z.infer<typeof ProgressShareResponseSchema>;
export type InviteStatsResponse = z.infer<typeof InviteStatsResponseSchema>;

// Additional response types
export const NewQuestionResponseSchema = z.object({
  id: UuidSchema
});

export type NewQuestionResponse = z.infer<typeof NewQuestionResponseSchema>;
