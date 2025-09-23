// --- Data Structures ---

import {
  type UserAnswer, 
  type DailyLogPayload, 
  type UserChallenge,
  type AllLogKeysType,
  type LogValueType,
  type User,
  type ProgressShare,
} from "$lib/server/db/schema";

// --- Service Types (for Dependency Injection) ---

// --- Auth Context ---'
export type RequestContext = {
    requestDate: Date; // the timestamp/instant of the incoming request
    requestId: string; // the requestId UUID of the request
};

export type UserContext = {
  id: string;
  email?: string;
  created_at: string;
};
  
export type AuthRequestContext = RequestContext & {
  user: UserContext;
};

export type MaybeAuthRequestContext = RequestContext & {
    getUserContext: () => Promise<UserContext | null>;
};

export type DatesOnEarthAtInstant = { earliest: string, utc: string, latest: string };
export type Offsets = {
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
  milliseconds?: number;
}

// --- Challenge System Types ---

// --- Challenge DTOs ---

export type CreateUserChallengeDto = {
  challengeId: string;
  startDate: string; // YYYY-MM-DD format
};

export type UpdateUserChallengeScheduleDto = {
  userChallengeId: string;
  newStartDate: string; // YYYY-MM-DD format
};

export type SubmitUserChallengeQuizDto = {
  userChallengeId: string;
  knowledgeBaseId: string;
  quizAnswers: UserAnswer[];
  overrideSubmission?: boolean;
};

export type PutUserLogDto = {
  logDate: string; // YYYY-MM-DD format
  values: DailyLogPayload;
};

export type ListUserLogsDto = {
  userChallengeId?: string;
  fromDate?: string; // YYYY-MM-DD format
  toDate?: string; // YYYY-MM-DD format
};

export type ListUserChallengeQuizSubmissionsDto = {
  userChallengeId: string;
  fromDate?: string; // YYYY-MM-DD format
  toDate?: string; // YYYY-MM-DD format
};

// --- Challenge Response Types ---

export type NewUserChallengeResponse = {
  id: string;
};

export type UserChallengeSummaryResponse = NewUserChallengeResponse & {
  challengeId: string;
  userId: string;
  startDate: string;
  originalStartDate: string;
  status: 'not_started' | 'active' | 'completed' | 'locked' | 'inactive';
  knowledgeBaseCompletedCount: number;
  dailyLogCount: number;
  lastActivityDate?: string;
  createdAt: string;
  updatedAt: string;
};

export type UserChallengeDetailResponse = UserChallengeSummaryResponse

export type UserLogResponse = {
  logDate: string;
  // @TODO: decouple the database models from the service layer
  values: {
    [Property in keyof DailyLogPayload]?: LogValueType<number>;
  };
};

export type UserChallengeProgressResponse = {
  id: string;
  userChallengeId: string;
  knowledgeBaseId: string;
  allCorrectAnswers: boolean;
  // @TODO: decouple the database models from the service layer
  quizAnswers: UserAnswer[];
  firstAttemptedAt: string;
  lastAttemptedAt: string;
  attempts: number;
};

export type ImplicitStatusCheckPayload = {
  referenceDate: Date; // usually requestDate but might be logDate?
  challengeId: string;
};

export type ActiveChallengesStatusCheckPayload = {
  requestDate: Date;
};

export type UserChallengeWithImplicitStatus = UserChallenge & {
  implicitStatus: (payload: Pick<ImplicitStatusCheckPayload, 'referenceDate'>) => UserChallenge['status'];
};

export type ActiveChallengeMetadata = {
  earliestStartDate: string;
  latestEndDate: string;
  activeChallengeLoggingKeys: AllLogKeysType[];
};

type Nullable<T> = T | null;

// --- User Profile DTOs ---
export type UpdateUserProfileDto = {
  displayName?: Nullable<User['displayName']>;
  avatarGender?: Nullable<User['avatarGender']>;
  avatarAgeRange?: Nullable<User['avatarAgeRange']>;
  personalizationCountryCodes?: Nullable<User['personalizationCountryCodes']>;
  timezone?: Nullable<User['timezone']>;
  preferredReminderTime?: Nullable<User['preferredReminderTime']>;
  notificationPreferences?: Nullable<User['notificationPreferences']>;
};

export type UserProfileResponse = {
  id: string;
  email?: string;
  displayName: string | null;
  avatarGender: string | null;
  avatarAgeRange: string | null;
  personalizationCountryCodes: string[] | null;
  timezone: string | null;
  preferredReminderTime: string | null;
  notificationPreferences: {
    daily: boolean;
    social: boolean;
    fitness_level: boolean;
  } | null;
};

// --- Social Features DTOs ---

// Question DTOs
export type SubmitQuestionDto = {
  articleIds: string[];
  title: string;
  body: string;
  isAnonymous: boolean;
};

export type ListQuestionsDto = {
  articleId: string;
  page?: number;
  limit?: number;
};

export type GetQuestionDto = {
  questionId: string;
};

export type NewQuestionResponse = {
  id: string;
};

export type QuestionResponse = NewQuestionResponse & {
  title: string;
  body: string;
  status: 'pending' | 'approved' | 'rejected' | 'hidden';
  helpfulCount: number;
  notHelpfulCount: number;
  createdAt: string;
  updatedAt: string;
  userId: string | null;
};

// Answer DTOs
export type SubmitAnswerDto = {
  questionId: string;
  answer: string;
  isAnonymous: boolean;
};

export type ListAnswersDto = {
  questionId: string;
  page?: number;
  limit?: number;
};

export type GetAnswerDto = {
  questionId: string;
  answerId: string;
};

export type NewAnswerResponse = {
  id: string;
};

export type AnswerResponse = NewAnswerResponse & {
  answer: string;
  status: 'pending' | 'approved' | 'rejected' | 'hidden';
  helpfulCount: number;
  notHelpfulCount: number;
  createdAt: string;
  userId: string | null;
};

// Reaction DTOs
export type AddReactionDto = {
  questionId: string;
  reactionType: 'helpful' | 'not_helpful';
};

export type AddAnswerReactionDto = {
  questionId: string;
  answerId: string;
  reactionType: 'helpful' | 'not_helpful';
};

// Share DTOs

export type NewProgressShareResponse = {
  id: string;
};

export type ShareProgressDto = {
  shareType: ProgressShare['shareType'];
  shareTypeId?: string;
  includeInviteLink: boolean;
  isPublic: boolean;
};

export type AddShareReactionDto = {
  shareId: string;
  reactionType: 'clap' | 'muscle' | 'party';
};

export type GetUserSharesDto = {
  page?: number;
  limit?: number;
};

export type GetPublicSharesDto = {
  shareType: ProgressShare['shareType'];
  page?: number;
  limit?: number;
};

export type DeleteShareDto = {
  shareId: string;
};

export type GetUserShareDto = {
  shareId: string;
};

export type UpdateShareStatusDto = {
  shareId: string;
  status: ProgressShare['status'];
  isPublic: boolean;
  includeInviteLink: boolean;
};

export type GetShareDto = {
  shareId: string;
};

export type ProgressSharePublicListResponse = {
  id: string;
  userId: string;
  title: string;
  shareType: ProgressShare["shareType"];
  clapCount: number;
  muscleCount: number;
  partyCount: number;
  createdAt: string;
}

export type ProgressShareDetailResponse = ProgressSharePublicListResponse & {
  contentVersion: string;
  generatedContent: Record<string, unknown>;
};

export type ProgressShareUserListResponse = ProgressSharePublicListResponse & {
  includeInviteLink: boolean;
  isPublic: boolean;
  status: ProgressShare['status'];
}

export type ProgressShareUserDetailResponse = ProgressShareUserListResponse & ProgressShareDetailResponse;

// Invitation DTOs
export type InviteStatsResponse = {
  invitationCode: string;
  invitationLink: string;
  invitationJoinCount: number;
};
