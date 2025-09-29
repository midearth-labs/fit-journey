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
import { CHALLENGE_CONSTANTS } from '../content/types/constants';
// import { ChallengeSchema } from '$lib/server/content/types/challenge'; // Old content system schema

// --- User Profile Schemas ---

export const UpdateUserProfileDtoSchema = z.object({
  displayName: DisplayNameSchema.nullable().optional(),
  avatarGender: AvatarGenderSchema.nullable().optional(),
  avatarAgeRange: AvatarAgeRangeSchema.nullable().optional(),
  personalizationCountryCodes: z.array(CountryCodeSchema).min(1, 'At least one country code required').nullable().optional(),
  timezone: TimezoneSchema.nullable().optional(),
  preferredReminderTime: TimeSchema.nullable().optional(),
  notificationPreferences: NotificationPreferencesSchema.nullable().optional()
});

export const UserProfileResponseSchema = z.object({
  id: UuidSchema,
  email: EmailSchema.optional(),
  displayName: z.string().nullable(),
  avatarGender: z.string().nullable(),
  avatarAgeRange: z.string().nullable(),
  personalizationCountryCodes: z.array(z.string()).nullable(),
  timezone: z.string().nullable(),
  preferredReminderTime: z.string().nullable(),
  notificationPreferences: NotificationPreferencesSchema.nullable(),
  invitationCode: UuidSchema.nullable(),
  invitationJoinCount: z.number().int().min(0),
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
// V2 Challenges DTO Schemas
export const CreateChallengeDtoSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000),
  goals: z.array(z.string().trim().min(1)).min(1).max(10),
  startDate: IsoDateSchema,
  durationDays: z.number().int().min(1).max(CHALLENGE_CONSTANTS.MAX_CHALLENGE_DURATION_DAYS),
  joinType: z.enum(['personal', 'public', 'invite-code']),
  maxMembers: z.number().int().min(1).max(1000).default(1),
});

export const UpdateChallengeDtoSchema = CreateChallengeDtoSchema;

export const JoinChallengeDtoSchema = z.object({
  challengeId: UuidSchema,
  inviteCode: UuidSchema.optional(),
});

export const LeaveChallengeDtoSchema = z.object({
  challengeId: UuidSchema,
});

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

// New Progress Share Response Schema (for shareProgress operation)
export const NewProgressShareResponseSchema = z.object({
  id: UuidSchema
});

// Progress Share Public List Response Schema
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

// Progress Share Detail Response Schema (extends public list with content)
export const ProgressShareDetailResponseSchema = ProgressSharePublicListResponseSchema.extend({
  contentVersion: z.string(),
  generatedContent: z.record(z.string(), z.unknown())
});

// Progress Share User List Response Schema (extends public list with user-specific fields)
export const ProgressShareUserListResponseSchema = ProgressSharePublicListResponseSchema.extend({
  includeInviteLink: z.boolean(),
  isPublic: z.boolean(),
  status: ShareStatusSchema
});

// Progress Share User Detail Response Schema (extends user list with content)
export const ProgressShareUserDetailResponseSchema = ProgressShareUserListResponseSchema.extend(ProgressShareDetailResponseSchema.shape);

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

export const NewAnswerResponseSchema = z.object({
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

// New challenge response schema for V2 challenges
export const GetChallengeParamsSchema = z.object({ challengeId: UuidSchema });

export const GetUserChallengeResponseSchema = z.object({
  id: UuidSchema,
  name: z.string(),
  status: z.enum([
    'not_started',
    'active',
    'completed',
    'locked',
    'inactive',
  ]),
  description: z.string().nullable().optional(),
  goals: z.array(z.string()),
  startDate: IsoDateSchema,
  durationDays: z.number().int(),
  joinType: z.enum(['personal', 'public', 'invite-code']),
  maxMembers: z.number().int(),
  membersCount: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
  userId: UuidSchema.nullable()
});

export const ListChallengesOwnedByUserResponseSchema = GetUserChallengeResponseSchema.extend({});
export const ListChallengeJoinedByUserMembersResponseSchema = GetUserChallengeResponseSchema.extend({});
export const ListPublicChallengesResponseSchema = GetUserChallengeResponseSchema.extend({});
export const GetChallengeResponseSchema = GetUserChallengeResponseSchema.extend({});

// Challenges V2 Operations
export const CreateUserChallengeOperationSchema = {
  request: {
    params: z.object({}),
    query: z.object({}),
    body: CreateChallengeDtoSchema
  },
  response: {
    body: z.object({ id: UuidSchema })
  }
};

export const GetChallengeOperationSchema = {
  request: {
    params: GetChallengeParamsSchema,
    query: z.object({}),
    body: z.void()
  },
  response: {
    body: GetChallengeResponseSchema
  }
};


export const UpdateUserChallengeOperationSchema = {
  request: {
    params: z.object({ challengeId: UuidSchema }),
    query: z.object({}),
    body: UpdateChallengeDtoSchema
  },
  response: {
    body: z.void()
  }
};

export const JoinChallengeOperationSchema = {
  request: {
    params: z.object({ challengeId: UuidSchema }),
    query: z.object({}),
    body: z.object({ inviteCode: UuidSchema.optional() })
  },
  response: {
    body: z.object({ id: UuidSchema })
  }
};

export const LeaveChallengeOperationSchema = {
  request: {
    params: z.object({ challengeId: UuidSchema }),
    query: z.object({}),
    body: z.void()
  },
  response: {
    body: z.void()
  }
};

export const ListPublicChallengesOperationSchema = {
  request: {
    params: z.object({}),
    query: z.object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20)
    }),
    body: z.void()
  },
  response: {
    body: z.array(ListPublicChallengesResponseSchema)
  }
};

// User Challenge Management Operations
export const GetUserChallengeOperationSchema = {
  request: {
    params: z.object({ challengeId: UuidSchema }),
    query: z.object({}),
    body: z.void()
  },
  response: {
    body: GetUserChallengeResponseSchema
  }
};

export const ListChallengesOwnedByUserOperationSchema = {
  request: {
    params: z.object({}),
    query: z.object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20)
    }),
    body: z.void()
  },
  response: {
    body: z.array(ListChallengesOwnedByUserResponseSchema)
  }
};

export const ListChallengeJoinedByUserMembersOperationSchema = {
  request: {
    params: z.object({ challengeId: UuidSchema }),
    query: z.object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20)
    }),
    body: z.void()
  },
  response: {
    body: z.array(z.object({
      id: UuidSchema,
      userId: UuidSchema.nullable(),
      joinedAt: z.string(),
      dailyLogCount: z.number().int().min(0),
    }))
  }
};

export const GetChallengeJoinedByUserSubscriptionOperationSchema = {
  request: {
    params: z.object({ challengeId: UuidSchema }),
    query: z.object({}),
    body: z.void()
  },
  response: {
    body: z.object({
      id: UuidSchema,
      joinedAt: z.string(),
      dailyLogCount: z.number().int().min(0),
      lastActivityDate: z.string().optional()
    })
  }
};

export const ListChallengesJoinedByUserOperationSchema = {
  request: {
    params: z.object({}),
    query: z.object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20)
    }),
    body: z.void()
  },
  response: {
    body: z.array(GetUserChallengeResponseSchema.pick({
      id: true,
      name: true,
      status: true,
      durationDays: true,
      startDate: true,
      joinType: true,
      membersCount: true,
    }).extend({
      joinedAt: z.string(),
      dailyLogCount: z.number().int().min(0),
      lastActivityDate: z.string().optional()
    }))
  }
};

export const DeleteUserChallengeOperationSchema = {
  request: {
    params: z.object({ challengeId: UuidSchema }),
    query: z.object({}),
    body: z.void()
  },
  response: {
    body: z.void()
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
    body: NewAnswerResponseSchema
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
    body: NewProgressShareResponseSchema
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

// Get User Share Operation
export const GetUserShareOperationSchema = {
  request: {
    params: z.object({
      shareId: UuidSchema
    }),
    query: z.object({}),
    body: z.void()
  },
  response: {
    body: ProgressShareUserDetailResponseSchema
  }
};

// Update Share Status Operation
export const UpdateShareStatusOperationSchema = {
  request: {
    params: z.object({
      shareId: UuidSchema
    }),
    query: z.object({}),
    body: z.object({
      status: ShareStatusSchema,
      isPublic: z.boolean(),
      includeInviteLink: z.boolean(),
    })
  },
  response: {
    body: z.void()
  }
};

// Get Share Operation (Public)
export const GetShareOperationSchema = {
  request: {
    params: z.object({
      shareId: UuidSchema
    }),
    query: z.object({}),
    body: z.void()
  },
  response: {
    body: ProgressShareDetailResponseSchema
  }
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

export type UpdateUserChallengeOperation = {
  request: {
    params: z.infer<typeof UpdateUserChallengeOperationSchema.request.params>;
    query: z.infer<typeof UpdateUserChallengeOperationSchema.request.query>;
    body: z.infer<typeof UpdateUserChallengeOperationSchema.request.body>;
  };
  response: {
    body: z.infer<typeof UpdateUserChallengeOperationSchema.response.body>;
  };
};

export type JoinChallengeOperation = {
  request: {
    params: z.infer<typeof JoinChallengeOperationSchema.request.params>;
    query: z.infer<typeof JoinChallengeOperationSchema.request.query>;
    body: z.infer<typeof JoinChallengeOperationSchema.request.body>;
  };
  response: {
    body: z.infer<typeof JoinChallengeOperationSchema.response.body>;
  };
};

export type LeaveChallengeOperation = {
  request: {
    params: z.infer<typeof LeaveChallengeOperationSchema.request.params>;
    query: z.infer<typeof LeaveChallengeOperationSchema.request.query>;
    body: z.infer<typeof LeaveChallengeOperationSchema.request.body>;
  };
  response: {
    body: z.infer<typeof LeaveChallengeOperationSchema.response.body>;
  };
};

export type ListPublicChallengesOperation = {
  request: {
    params: z.infer<typeof ListPublicChallengesOperationSchema.request.params>;
    query: z.infer<typeof ListPublicChallengesOperationSchema.request.query>;
    body: z.infer<typeof ListPublicChallengesOperationSchema.request.body>;
  };
  response: {
    body: z.infer<typeof ListPublicChallengesOperationSchema.response.body>;
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

export type GetUserShareOperation = {
  request: {
    params: z.infer<typeof GetUserShareOperationSchema.request.params>;
    query: z.infer<typeof GetUserShareOperationSchema.request.query>;
    body: z.infer<typeof GetUserShareOperationSchema.request.body>;
  };
  response: {
    body: z.infer<typeof GetUserShareOperationSchema.response.body>;
  };
};

export type UpdateShareStatusOperation = {
  request: {
    params: z.infer<typeof UpdateShareStatusOperationSchema.request.params>;
    query: z.infer<typeof UpdateShareStatusOperationSchema.request.query>;
    body: z.infer<typeof UpdateShareStatusOperationSchema.request.body>;
  };
  response: {
    body: z.infer<typeof UpdateShareStatusOperationSchema.response.body>;
  };
};

export type GetShareOperation = {
  request: {
    params: z.infer<typeof GetShareOperationSchema.request.params>;
    query: z.infer<typeof GetShareOperationSchema.request.query>;
    body: z.infer<typeof GetShareOperationSchema.request.body>;
  };
  response: {
    body: z.infer<typeof GetShareOperationSchema.response.body>;
  };
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

export type ListChallengesOwnedByUserOperation = {
  request: {
    params: z.infer<typeof ListChallengesOwnedByUserOperationSchema.request.params>;
    query: z.infer<typeof ListChallengesOwnedByUserOperationSchema.request.query>;
    body: z.infer<typeof ListChallengesOwnedByUserOperationSchema.request.body>;
  };
  response: {
    body: z.infer<typeof ListChallengesOwnedByUserOperationSchema.response.body>;
  };
};

export type ListChallengeJoinedByUserMembersOperation = {
  request: {
    params: z.infer<typeof ListChallengeJoinedByUserMembersOperationSchema.request.params>;
    query: z.infer<typeof ListChallengeJoinedByUserMembersOperationSchema.request.query>;
    body: z.infer<typeof ListChallengeJoinedByUserMembersOperationSchema.request.body>;
  };
  response: {
    body: z.infer<typeof ListChallengeJoinedByUserMembersOperationSchema.response.body>;
  };
};

export type GetChallengeJoinedByUserSubscriptionOperation = {
  request: {
    params: z.infer<typeof GetChallengeJoinedByUserSubscriptionOperationSchema.request.params>;
    query: z.infer<typeof GetChallengeJoinedByUserSubscriptionOperationSchema.request.query>;
    body: z.infer<typeof GetChallengeJoinedByUserSubscriptionOperationSchema.request.body>;
  };
  response: {
    body: z.infer<typeof GetChallengeJoinedByUserSubscriptionOperationSchema.response.body>;
  };
};

export type ListChallengesJoinedByUserOperation = {
  request: {
    params: z.infer<typeof ListChallengesJoinedByUserOperationSchema.request.params>;
    query: z.infer<typeof ListChallengesJoinedByUserOperationSchema.request.query>;
    body: z.infer<typeof ListChallengesJoinedByUserOperationSchema.request.body>;
  };
  response: {
    body: z.infer<typeof ListChallengesJoinedByUserOperationSchema.response.body>;
  };
};

export type DeleteUserChallengeOperation = {
  request: {
    params: z.infer<typeof DeleteUserChallengeOperationSchema.request.params>;
    query: z.infer<typeof DeleteUserChallengeOperationSchema.request.query>;
    body: z.infer<typeof DeleteUserChallengeOperationSchema.request.body>;
  };
  response: {
    body: z.infer<typeof DeleteUserChallengeOperationSchema.response.body>;
  };
};

// --- Article Service Operation Schemas ---

export const LogReadOperationSchema = {
  request: {
    params: z.object({ articleId: z.string() }),
  },
  response: {
    body: z.void(),
  }
};

export const StartQuizOperationSchema = {
  request: {
    params: z.object({ articleId: z.string() }),
  },
  response: {
    body: z.void(),
  }
};

export const SubmitQuizOperationSchema = {
  request: {
    params: z.object({ articleId: z.string() }),
    body: z.object({
      quizAnswers: z.array(z.object({
        questionId: z.string(),
        answerIndex: z.number().min(0).max(4),
        hintUsed: z.boolean()
      }))
    }),
  },
  response: {
    body: z.void(),
  }
};

export const RetryQuizOperationSchema = {
  request: {
    params: z.object({ articleId: z.string() }),
  },
  response: {
    body: z.void(),
  }
};

export const StartPracticalOperationSchema = {
  request: {
    params: z.object({ articleId: z.string() }),
  },
  response: {
    body: z.void(),
  }
};

export const CompletePracticalOperationSchema = {
  request: {
    params: z.object({ articleId: z.string() }),
  },
  response: {
    body: z.void(),
  }
};

export const SkipPracticalOperationSchema = {
  request: {
    params: z.object({ articleId: z.string() }),
  },
  response: {
    body: z.void(),
  }
};

export const CompleteArticleOperationSchema = {
  request: {
    params: z.object({ articleId: z.string() }),
  },
  response: {
    body: z.void(),
  }
};

export const ListUserArticlesOperationSchema = {
  request: {
    query: z.object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(100)
    }),
  },
  response: {
    body: z.array(z.object({
      articleId: z.string(),
      status: z.string(),
      firstReadDate: z.string().nullable(),
      lastReadDate: z.string().nullable(),
      quizAttempts: z.number(),
      quizAllCorrectAnswers: z.boolean(),
    })),
  }
};

export const GetUserArticleOperationSchema = {
  request: {
    params: z.object({ articleId: z.string() }),
  },
  response: {
    body: z.object({
      articleId: z.string(),
      status: z.string(),
      firstReadDate: z.string().nullable(),
      lastReadDate: z.string().nullable(),
      quizAttempts: z.number(),
      quizAllCorrectAnswers: z.boolean(),
      quizFirstAttemptedAt: z.string().nullable(),
      quizLastAttemptedAt: z.string().nullable(),
      quizStartedAt: z.string().nullable(),
      quizCompletedAt: z.string().nullable(),
      quizAnswers: z.array(z.object({
        questionId: z.string(),
        answer: z.string(),
        is_correct: z.boolean()
      })).nullable(),
      createdAt: z.string(),
      updatedAt: z.string(),
    }),
  }
};

// Article Operation Types
export type LogReadOperation = {
  request: {
    params: z.infer<typeof LogReadOperationSchema.request.params>;
  };
  response: {
    body: z.infer<typeof LogReadOperationSchema.response.body>;
  };
};

export type StartQuizOperation = {
  request: {
    params: z.infer<typeof StartQuizOperationSchema.request.params>;
  };
  response: {
    body: z.infer<typeof StartQuizOperationSchema.response.body>;
  };
};

export type SubmitQuizOperation = {
  request: {
    params: z.infer<typeof SubmitQuizOperationSchema.request.params>;
    body: z.infer<typeof SubmitQuizOperationSchema.request.body>;
  };
  response: {
    body: z.infer<typeof SubmitQuizOperationSchema.response.body>;
  };
};

export type RetryQuizOperation = {
  request: {
    params: z.infer<typeof RetryQuizOperationSchema.request.params>;
  };
  response: {
    body: z.infer<typeof RetryQuizOperationSchema.response.body>;
  };
};

export type StartPracticalOperation = {
  request: {
    params: z.infer<typeof StartPracticalOperationSchema.request.params>;
  };
  response: {
    body: z.infer<typeof StartPracticalOperationSchema.response.body>;
  };
};

export type CompletePracticalOperation = {
  request: {
    params: z.infer<typeof CompletePracticalOperationSchema.request.params>;
  };
  response: {
    body: z.infer<typeof CompletePracticalOperationSchema.response.body>;
  };
};

export type SkipPracticalOperation = {
  request: {
    params: z.infer<typeof SkipPracticalOperationSchema.request.params>;
  };
  response: {
    body: z.infer<typeof SkipPracticalOperationSchema.response.body>;
  };
};

export type CompleteArticleOperation = {
  request: {
    params: z.infer<typeof CompleteArticleOperationSchema.request.params>;
  };
  response: {
    body: z.infer<typeof CompleteArticleOperationSchema.response.body>;
  };
};

export type ListUserArticlesOperation = {
  request: {
    query: z.infer<typeof ListUserArticlesOperationSchema.request.query>;
  };
  response: {
    body: z.infer<typeof ListUserArticlesOperationSchema.response.body>;
  };
};

export type GetUserArticleOperation = {
  request: {
    params: z.infer<typeof GetUserArticleOperationSchema.request.params>;
  };
  response: {
    body: z.infer<typeof GetUserArticleOperationSchema.response.body>;
  };
};

// --- Calendar Integration Schemas ---

// Calendar Settings DTO Schema
export const UpdateCalendarSettingsDtoSchema = z.object({
  challengeReminderTime: TimeSchema.nullable().optional(),
  articleReminderFrequency: z.enum(['daily', 'weekly', 'biweekly']).nullable().optional(),
  articleReminderTime: TimeSchema.nullable().optional(),
  timezone: TimezoneSchema.nullable().optional(),
  enableCalendarIntegration: z.boolean().optional()
});

// Calendar Settings Response Schema
export const CalendarSettingsResponseSchema = z.object({
  calendarCode: UuidSchema.nullable(),
  challengeReminderTime: z.string().nullable(),
  articleReminderFrequency: z.string().nullable(),
  articleReminderTime: z.string().nullable(),
  timezone: z.string().nullable(),
  enableCalendarIntegration: z.boolean(),
  calendarUrl: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string()
});

// Calendar Operations
export const UpdateCalendarSettingsOperationSchema = {
  request: {
    params: z.object({}),
    query: z.object({}),
    body: UpdateCalendarSettingsDtoSchema
  },
  response: {
    body: z.void()
  }
};

export const GetCalendarSettingsOperationSchema = {
  request: {
    params: z.object({}),
    query: z.object({}),
    body: z.void()
  },
  response: {
    body: CalendarSettingsResponseSchema
  }
};

export const DownloadUserCalendarOperationSchema = {
  request: {
    params: z.object({}),
    query: z.object({}),
    body: z.void()
  },
  response: {
    body: z.instanceof(Blob) // ICS content
  }
};

export const GetPublicCalendarOperationSchema = {
  request: {
    params: z.object({ calendarCode: UuidSchema }),
    query: z.object({}),
    body: z.void()
  },
  response: {
    body: z.instanceof(Blob) // ICS content
  }
};

// Calendar Operation Types
export type UpdateCalendarSettingsOperation = {
  request: {
    params: z.infer<typeof UpdateCalendarSettingsOperationSchema.request.params>;
    query: z.infer<typeof UpdateCalendarSettingsOperationSchema.request.query>;
    body: z.infer<typeof UpdateCalendarSettingsOperationSchema.request.body>;
  };
  response: {
    body: z.infer<typeof UpdateCalendarSettingsOperationSchema.response.body>;
  };
};

export type GetCalendarSettingsOperation = {
  request: {
    params: z.infer<typeof GetCalendarSettingsOperationSchema.request.params>;
    query: z.infer<typeof GetCalendarSettingsOperationSchema.request.query>;
    body: z.infer<typeof GetCalendarSettingsOperationSchema.request.body>;
  };
  response: {
    body: z.infer<typeof GetCalendarSettingsOperationSchema.response.body>;
  };
};

export type DownloadUserCalendarOperation = {
  request: {
    params: z.infer<typeof DownloadUserCalendarOperationSchema.request.params>;
    query: z.infer<typeof DownloadUserCalendarOperationSchema.request.query>;
    body: z.infer<typeof DownloadUserCalendarOperationSchema.request.body>;
  };
  response: {
    body: z.infer<typeof DownloadUserCalendarOperationSchema.response.body>;
  };
};

export type GetPublicCalendarOperation = {
  request: {
    params: z.infer<typeof GetPublicCalendarOperationSchema.request.params>;
    query: z.infer<typeof GetPublicCalendarOperationSchema.request.query>;
    body: z.infer<typeof GetPublicCalendarOperationSchema.request.body>;
  };
  response: {
    body: z.infer<typeof GetPublicCalendarOperationSchema.response.body>;
  };
};
