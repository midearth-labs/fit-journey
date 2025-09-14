import { z } from 'zod';
import { UUIDSchema, DateStringSchema, UserAnswerSchema, DailyHabitLogPayloadSchema } from './common';

// Challenge Content Service Request Schemas

export const GetChallengeByIdRequestSchema = z.object({
  challengeId: UUIDSchema,
});

export const GetAllChallengesRequestSchema = z.object({});

// Challenge Service Request Schemas

export const CreateUserChallengeRequestSchema = z.object({
  challengeId: UUIDSchema,
  startDate: DateStringSchema,
});

export const GetUserChallengeRequestSchema = z.object({
  userChallengeId: UUIDSchema,
});

export const ListUserChallengesRequestSchema = z.object({});

export const UpdateUserChallengeScheduleRequestSchema = z.object({
  userChallengeId: UUIDSchema,
  newStartDate: DateStringSchema,
});

export const SubmitUserChallengeQuizRequestSchema = z.object({
  userChallengeId: UUIDSchema,
  knowledgeBaseId: UUIDSchema,
  quizAnswers: z.array(UserAnswerSchema),
  overrideSubmission: z.boolean().optional(),
});

export const PutUserChallengeLogRequestSchema = z.object({
  userChallengeId: UUIDSchema,
  logDate: DateStringSchema,
  values: DailyHabitLogPayloadSchema,
});

export const ListUserChallengeLogsRequestSchema = z.object({
  userChallengeId: UUIDSchema,
  fromDate: DateStringSchema.optional(),
  toDate: DateStringSchema.optional(),
});

export const ListUserChallengeQuizSubmissionsRequestSchema = z.object({
  userChallengeId: UUIDSchema,
});

export const UpdateChallengeStatusesRequestSchema = z.object({});

// Query parameter schemas for GET requests
export const ListUserChallengeLogsQuerySchema = z.object({
  fromDate: DateStringSchema.optional(),
  toDate: DateStringSchema.optional(),
});

export const ListUserChallengeQuizSubmissionsQuerySchema = z.object({});
