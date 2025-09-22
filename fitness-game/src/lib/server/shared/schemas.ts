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
export type ProgressSharePublicListResponse = z.infer<typeof ProgressSharePublicListResponseSchema>;
export type ProgressShareUserListResponse = z.infer<typeof ProgressShareUserListResponseSchema>;

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

export const ProgressSharePublicListResponseSchema = z.object({
  id: UuidSchema,
  userId: UuidSchema,
  title: z.string(),
  shareType: ShareTypeSchema,
  clapCount: z.number().int().min(0),
  muscleCount: z.number().int().min(0),
  partyCount: z.number().int().min(0),
  createdAt: z.string()
});

export const ProgressShareUserListResponseSchema = ProgressSharePublicListResponseSchema.extend({
  includeInviteLink: z.boolean(),
  isPublic: z.boolean(),
  status: ShareStatusSchema
});

// Invitation Schemas
export const InviteStatsResponseSchema = z.object({
  invitationCode: UuidSchema,
  invitationLink: z.string().url(),
  invitationJoinCount: z.number().int().min(0)
});

// Additional response types
export const NewQuestionResponseSchema = z.object({
  id: UuidSchema
});

// --- Consolidated Operation Schemas ---

// User Profile Operations
export const GetUserProfileOperationSchema = {
  request: {
    params: z.object({}),
    query: z.object({}),
    body: z.void()
  },
  response: {
    body: UserProfileResponseSchema
  }
};

export const UpdateUserProfileOperationSchema = {
  request: {
    params: z.object({}),
    query: z.object({}),
    body: UpdateUserProfileDtoSchema
  },
  response: {
    body: z.void()
  }
};

// Log Operations
export const ListUserLogsOperationSchema = {
  request: {
    params: z.object({}),
    query: ListUserLogsQuerySchema,
    body: z.void()
  },
  response: {
    body: UserLogResponseSchema.array()
  }
};

export const PutUserLogOperationSchema = {
  request: {
    params: z.object({ logDate: IsoDateSchema }),
    query: z.object({}),
    body: z.object({ values: DailyLogPayloadSchema })
  },
  response: {
    body: z.void()
  }
};

// User Challenge Operations
export const CreateUserChallengeOperationSchema = {
  request: {
    params: z.object({}),
    query: z.object({}),
    body: CreateUserChallengeDtoSchema
  },
  response: {
    body: NewUserChallengeResponseSchema
  }
};

export const ListUserChallengesOperationSchema = {
  request: {
    params: z.object({}),
    query: z.object({}),
    body: z.void()
  },
  response: {
    body: NewUserChallengeResponseSchema.array()
  }
};

export const GetUserChallengeOperationSchema = {
  request: {
    params: z.object({ userChallengeId: UuidSchema }),
    query: z.object({}),
    body: z.void()
  },
  response: {
    body: UserChallengeDetailResponseSchema
  }
};

export const UpdateUserChallengeScheduleOperationSchema = {
  request: {
    params: z.object({ userChallengeId: UuidSchema }),
    query: z.object({}),
    body: z.object({ newStartDate: IsoDateSchema })
  },
  response: {
    body: z.void()
  }
};

export const CancelUserChallengeOperationSchema = {
  request: {
    params: z.object({ userChallengeId: UuidSchema }),
    query: z.object({}),
    body: z.void()
  },
  response: {
    body: z.void()
  }
};

// User Challenge Quiz Operations
export const ListUserChallengeQuizSubmissionsOperationSchema = {
  request: {
    params: z.object({ userChallengeId: UuidSchema }),
    query: z.object({
      fromDate: IsoDateSchema.optional(),
      toDate: IsoDateSchema.optional()
    }),
    body: z.void()
  },
  response: {
    body: UserChallengeProgressResponseSchema.array()
  }
};

export const SubmitUserChallengeQuizOperationSchema = {
  request: {
    params: z.object({ 
      userChallengeId: UuidSchema,
      knowledgeBaseId: UuidSchema 
    }),
    query: z.object({}),
    body: z.object({
      quizAnswers: z.array(UserAnswerSchema).min(1, 'At least one answer required'),
      overrideSubmission: z.boolean().optional()
    })
  },
  response: {
    body: z.void()
  }
};

// Content Operations
export const ListChallengesOperationSchema = {
  request: {
    params: z.object({}),
    query: z.object({}),
    body: z.void()
  },
  response: {
    // @TODO: figure out why this is ANY and also the below
    body: z.any() // Generic content response
  }
};

export const GetChallengeOperationSchema = {
  request: {
    params: z.object({ challengeId: UuidSchema }),
    query: z.object({}),
    body: z.void()
  },
  response: {
    body: z.any() // Generic content response
  }
};

// Social Question Operations
export const SubmitQuestionOperationSchema = {
  request: {
    params: z.object({}),
    query: z.object({}),
    body: SubmitQuestionDtoSchema
  },
  response: {
    body: NewQuestionResponseSchema
  }
};

export const ListQuestionsOperationSchema = {
  request: {
    params: z.object({}),
    query: ListQuestionsQuerySchema,
    body: z.void()
  },
  response: {
    body: QuestionResponseSchema.array()
  }
};

export const GetQuestionOperationSchema = {
  request: {
    params: z.object({ questionId: UuidSchema }),
    query: z.object({}),
    body: z.void()
  },
  response: {
    body: QuestionResponseSchema
  }
};

export const AddQuestionReactionOperationSchema = {
  request: {
    params: z.object({ questionId: UuidSchema }),
    query: z.object({}),
    body: z.object({ reactionType: ReactionTypeSchema })
  },
  response: {
    body: z.void()
  }
};

// Social Answer Operations
export const SubmitAnswerOperationSchema = {
  request: {
    params: z.object({ questionId: UuidSchema }),
    query: z.object({}),
    body: z.object({
      answer: z.string().trim().min(10, 'Answer must be at least 10 characters').max(2000, 'Answer must be no more than 2000 characters'),
      isAnonymous: z.boolean().default(false)
    })
  },
  response: {
    body: z.void()
  }
};

export const ListAnswersOperationSchema = {
  request: {
    params: z.object({ questionId: UuidSchema }),
    query: z.object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20)
    }),
    body: z.void()
  },
  response: {
    body: AnswerResponseSchema.array()
  }
};

export const GetAnswerOperationSchema = {
  request: {
    params: z.object({ 
      questionId: UuidSchema,
      answerId: UuidSchema 
    }),
    query: z.object({}),
    body: z.void()
  },
  response: {
    body: AnswerResponseSchema
  }
};

export const AddAnswerReactionOperationSchema = {
  request: {
    params: z.object({ 
      questionId: UuidSchema,
      answerId: UuidSchema 
    }),
    query: z.object({}),
    body: z.object({ reactionType: ReactionTypeSchema })
  },
  response: {
    body: z.void()
  }
};

// Social Share Operations
export const ShareProgressOperationSchema = {
  request: {
    params: z.object({}),
    query: z.object({}),
    body: ShareProgressDtoSchema
  },
  response: {
    body: ProgressShareResponseSchema
  }
};

export const AddShareReactionOperationSchema = {
  request: {
    params: z.object({ shareId: UuidSchema }),
    query: z.object({}),
    body: z.object({ reactionType: EmojiReactionTypeSchema })
  },
  response: {
    body: z.void()
  }
};

// Social Invitation Operations
export const GetInviteStatsOperationSchema = {
  request: {
    params: z.object({}),
    query: z.object({}),
    body: z.void()
  },
  response: {
    body: InviteStatsResponseSchema
  }
};

// Export inferred operation types
export type GetUserProfileOperation = {
  request: {
    params: z.infer<typeof GetUserProfileOperationSchema.request.params>;
    query: z.infer<typeof GetUserProfileOperationSchema.request.query>;
    body: z.infer<typeof GetUserProfileOperationSchema.request.body>;
  };
  response: {
    body: z.infer<typeof GetUserProfileOperationSchema.response.body>;
  };
};

export type UpdateUserProfileOperation = {
  request: {
    params: z.infer<typeof UpdateUserProfileOperationSchema.request.params>;
    query: z.infer<typeof UpdateUserProfileOperationSchema.request.query>;
    body: z.infer<typeof UpdateUserProfileOperationSchema.request.body>;
  };
  response: {
    body: z.infer<typeof UpdateUserProfileOperationSchema.response.body>;
  };
};

export type ListUserLogsOperation = {
  request: {
    params: z.infer<typeof ListUserLogsOperationSchema.request.params>;
    query: z.infer<typeof ListUserLogsOperationSchema.request.query>;
    body: z.infer<typeof ListUserLogsOperationSchema.request.body>;
  };
  response: {
    body: z.infer<typeof ListUserLogsOperationSchema.response.body>;
  };
};

export type PutUserLogOperation = {
  request: {
    params: z.infer<typeof PutUserLogOperationSchema.request.params>;
    query: z.infer<typeof PutUserLogOperationSchema.request.query>;
    body: z.infer<typeof PutUserLogOperationSchema.request.body>;
  };
  response: {
    body: z.infer<typeof PutUserLogOperationSchema.response.body>;
  };
};

export type CreateUserChallengeOperation = {
  request: {
    params: z.infer<typeof CreateUserChallengeOperationSchema.request.params>;
    query: z.infer<typeof CreateUserChallengeOperationSchema.request.query>;
    body: z.infer<typeof CreateUserChallengeOperationSchema.request.body>;
  };
  response: {
    body: z.infer<typeof CreateUserChallengeOperationSchema.response.body>;
  };
};

export type ListUserChallengesOperation = {
  request: {
    params: z.infer<typeof ListUserChallengesOperationSchema.request.params>;
    query: z.infer<typeof ListUserChallengesOperationSchema.request.query>;
    body: z.infer<typeof ListUserChallengesOperationSchema.request.body>;
  };
  response: {
    body: z.infer<typeof ListUserChallengesOperationSchema.response.body>;
  };
};

export type GetUserChallengeOperation = {
  request: {
    params: z.infer<typeof GetUserChallengeOperationSchema.request.params>;
    query: z.infer<typeof GetUserChallengeOperationSchema.request.query>;
    body: z.infer<typeof GetUserChallengeOperationSchema.request.body>;
  };
  response: {
    body: z.infer<typeof GetUserChallengeOperationSchema.response.body>;
  };
};

export type UpdateUserChallengeScheduleOperation = {
  request: {
    params: z.infer<typeof UpdateUserChallengeScheduleOperationSchema.request.params>;
    query: z.infer<typeof UpdateUserChallengeScheduleOperationSchema.request.query>;
    body: z.infer<typeof UpdateUserChallengeScheduleOperationSchema.request.body>;
  };
  response: {
    body: z.infer<typeof UpdateUserChallengeScheduleOperationSchema.response.body>;
  };
};

export type CancelUserChallengeOperation = {
  request: {
    params: z.infer<typeof CancelUserChallengeOperationSchema.request.params>;
    query: z.infer<typeof CancelUserChallengeOperationSchema.request.query>;
    body: z.infer<typeof CancelUserChallengeOperationSchema.request.body>;
  };
  response: {
    body: z.infer<typeof CancelUserChallengeOperationSchema.response.body>;
  };
};

export type ListUserChallengeQuizSubmissionsOperation = {
  request: {
    params: z.infer<typeof ListUserChallengeQuizSubmissionsOperationSchema.request.params>;
    query: z.infer<typeof ListUserChallengeQuizSubmissionsOperationSchema.request.query>;
    body: z.infer<typeof ListUserChallengeQuizSubmissionsOperationSchema.request.body>;
  };
  response: {
    body: z.infer<typeof ListUserChallengeQuizSubmissionsOperationSchema.response.body>;
  };
};

export type SubmitUserChallengeQuizOperation = {
  request: {
    params: z.infer<typeof SubmitUserChallengeQuizOperationSchema.request.params>;
    query: z.infer<typeof SubmitUserChallengeQuizOperationSchema.request.query>;
    body: z.infer<typeof SubmitUserChallengeQuizOperationSchema.request.body>;
  };
  response: {
    body: z.infer<typeof SubmitUserChallengeQuizOperationSchema.response.body>;
  };
};

export type ListChallengesOperation = {
  request: {
    params: z.infer<typeof ListChallengesOperationSchema.request.params>;
    query: z.infer<typeof ListChallengesOperationSchema.request.query>;
    body: z.infer<typeof ListChallengesOperationSchema.request.body>;
  };
  response: {
    body: z.infer<typeof ListChallengesOperationSchema.response.body>;
  };
};

export type GetChallengeOperation = {
  request: {
    params: z.infer<typeof GetChallengeOperationSchema.request.params>;
    query: z.infer<typeof GetChallengeOperationSchema.request.query>;
    body: z.infer<typeof GetChallengeOperationSchema.request.body>;
  };
  response: {
    body: z.infer<typeof GetChallengeOperationSchema.response.body>;
  };
};

export type SubmitQuestionOperation = {
  request: {
    params: z.infer<typeof SubmitQuestionOperationSchema.request.params>;
    query: z.infer<typeof SubmitQuestionOperationSchema.request.query>;
    body: z.infer<typeof SubmitQuestionOperationSchema.request.body>;
  };
  response: {
    body: z.infer<typeof SubmitQuestionOperationSchema.response.body>;
  };
};

export type ListQuestionsOperation = {
  request: {
    params: z.infer<typeof ListQuestionsOperationSchema.request.params>;
    query: z.infer<typeof ListQuestionsOperationSchema.request.query>;
    body: z.infer<typeof ListQuestionsOperationSchema.request.body>;
  };
  response: {
    body: z.infer<typeof ListQuestionsOperationSchema.response.body>;
  };
};

export type GetQuestionOperation = {
  request: {
    params: z.infer<typeof GetQuestionOperationSchema.request.params>;
    query: z.infer<typeof GetQuestionOperationSchema.request.query>;
    body: z.infer<typeof GetQuestionOperationSchema.request.body>;
  };
  response: {
    body: z.infer<typeof GetQuestionOperationSchema.response.body>;
  };
};

export type AddQuestionReactionOperation = {
  request: {
    params: z.infer<typeof AddQuestionReactionOperationSchema.request.params>;
    query: z.infer<typeof AddQuestionReactionOperationSchema.request.query>;
    body: z.infer<typeof AddQuestionReactionOperationSchema.request.body>;
  };
  response: {
    body: z.infer<typeof AddQuestionReactionOperationSchema.response.body>;
  };
};

export type SubmitAnswerOperation = {
  request: {
    params: z.infer<typeof SubmitAnswerOperationSchema.request.params>;
    query: z.infer<typeof SubmitAnswerOperationSchema.request.query>;
    body: z.infer<typeof SubmitAnswerOperationSchema.request.body>;
  };
  response: {
    body: z.infer<typeof SubmitAnswerOperationSchema.response.body>;
  };
};

export type ListAnswersOperation = {
  request: {
    params: z.infer<typeof ListAnswersOperationSchema.request.params>;
    query: z.infer<typeof ListAnswersOperationSchema.request.query>;
    body: z.infer<typeof ListAnswersOperationSchema.request.body>;
  };
  response: {
    body: z.infer<typeof ListAnswersOperationSchema.response.body>;
  };
};

export type GetAnswerOperation = {
  request: {
    params: z.infer<typeof GetAnswerOperationSchema.request.params>;
    query: z.infer<typeof GetAnswerOperationSchema.request.query>;
    body: z.infer<typeof GetAnswerOperationSchema.request.body>;
  };
  response: {
    body: z.infer<typeof GetAnswerOperationSchema.response.body>;
  };
};

export type AddAnswerReactionOperation = {
  request: {
    params: z.infer<typeof AddAnswerReactionOperationSchema.request.params>;
    query: z.infer<typeof AddAnswerReactionOperationSchema.request.query>;
    body: z.infer<typeof AddAnswerReactionOperationSchema.request.body>;
  };
  response: {
    body: z.infer<typeof AddAnswerReactionOperationSchema.response.body>;
  };
};

export type ShareProgressOperation = {
  request: {
    params: z.infer<typeof ShareProgressOperationSchema.request.params>;
    query: z.infer<typeof ShareProgressOperationSchema.request.query>;
    body: z.infer<typeof ShareProgressOperationSchema.request.body>;
  };
  response: {
    body: z.infer<typeof ShareProgressOperationSchema.response.body>;
  };
};

export type AddShareReactionOperation = {
  request: {
    params: z.infer<typeof AddShareReactionOperationSchema.request.params>;
    query: z.infer<typeof AddShareReactionOperationSchema.request.query>;
    body: z.infer<typeof AddShareReactionOperationSchema.request.body>;
  };
  response: {
    body: z.infer<typeof AddShareReactionOperationSchema.response.body>;
  };
};

export type GetInviteStatsOperation = {
  request: {
    params: z.infer<typeof GetInviteStatsOperationSchema.request.params>;
    query: z.infer<typeof GetInviteStatsOperationSchema.request.query>;
    body: z.infer<typeof GetInviteStatsOperationSchema.request.body>;
  };
  response: {
    body: z.infer<typeof GetInviteStatsOperationSchema.response.body>;
  };
};

// Get User Shares Operation
export const GetUserSharesOperationSchema = {
  request: {
    params: z.object({}),
    query: z.object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20)
    }),
    body: z.void()
  },
  response: {
    body: z.array(ProgressShareUserListResponseSchema)
  }
};

export type GetUserSharesOperation = {
  request: {
    params: z.infer<typeof GetUserSharesOperationSchema.request.params>;
    query: z.infer<typeof GetUserSharesOperationSchema.request.query>;
    body: z.infer<typeof GetUserSharesOperationSchema.request.body>;
  };
  response: {
    body: z.infer<typeof GetUserSharesOperationSchema.response.body>;
  };
};

// Get Public Shares Operation
export const GetPublicSharesOperationSchema = {
  request: {
    params: z.object({}),
    query: z.object({
      shareType: ShareTypeSchema,
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(50)
    }),
    body: z.void()
  },
  response: {
    body: z.array(ProgressSharePublicListResponseSchema)
  }
};

export type GetPublicSharesOperation = {
  request: {
    params: z.infer<typeof GetPublicSharesOperationSchema.request.params>;
    query: z.infer<typeof GetPublicSharesOperationSchema.request.query>;
    body: z.infer<typeof GetPublicSharesOperationSchema.request.body>;
  };
  response: {
    body: z.infer<typeof GetPublicSharesOperationSchema.response.body>;
  };
};

// Delete Share Operation
export const DeleteShareOperationSchema = {
  request: {
    params: z.object({
      shareId: UuidSchema
    }),
    query: z.object({}),
    body: z.void()
  },
  response: {
    body: z.void()
  }
};

export type DeleteShareOperation = {
  request: {
    params: z.infer<typeof DeleteShareOperationSchema.request.params>;
    query: z.infer<typeof DeleteShareOperationSchema.request.query>;
    body: z.infer<typeof DeleteShareOperationSchema.request.body>;
  };
  response: {
    body: z.infer<typeof DeleteShareOperationSchema.response.body>;
  };
};
