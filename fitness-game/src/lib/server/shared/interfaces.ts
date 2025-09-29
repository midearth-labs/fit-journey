// --- Data Structures ---

import {
  type DailyLogPayload, 
  type AllLogKeysType,
  type User,
  type ProgressShare,
} from "$lib/server/db/schema";
import {
  type GetUserProfileOperation,
  type GetUserMetadataOperation,
  type ListUserLogsOperation,
  type CreateUserChallengeOperation,
  type SubmitQuestionOperation,
  type ListQuestionsOperation,
  type GetQuestionOperation,
  type SubmitAnswerOperation,
  type ListAnswersOperation,
  type GetAnswerOperation,
  type ShareProgressOperation,
  type GetUserSharesOperation,
  type GetPublicSharesOperation,
  type GetUserShareOperation,
  type GetShareOperation,
  type UpdateUserChallengeOperation,
  type JoinChallengeOperation,
  type LeaveChallengeOperation,
  type GetChallengeOperation,
  type ListPublicChallengesOperation,
  type GetUserChallengeOperation,
  type ListChallengesOwnedByUserOperation,
  type ListChallengeJoinedByUserMembersOperation,
  type GetChallengeJoinedByUserSubscriptionOperation,
  type ListChallengesJoinedByUserOperation,
  type DeleteUserChallengeOperation,
  type LogReadOperation,
  type StartQuizOperation,
  type SubmitQuizOperation,
  type RetryQuizOperation,
  type StartPracticalOperation,
  type CompletePracticalOperation,
  type SkipPracticalOperation,
  type CompleteArticleOperation,
  type ListUserArticlesOperation,
  type GetUserArticleOperation,
  type GetGlobalStatisticsOperation,
  type GetArticleStatisticsOperation,
} from './schemas';

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
    user: UserContext | null;
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

export type PutUserLogDto = {
  logDate: string; // YYYY-MM-DD format
  values: DailyLogPayload;
};

export type ListUserLogsDto = {
  userChallengeId?: string;
  fromDate?: string; // YYYY-MM-DD format
  toDate?: string; // YYYY-MM-DD format
};
// --- Challenge Response Types ---

export type UserLogResponse = ListUserLogsOperation['response']['body'][0];

export type ImplicitStatusCheckPayload = {
  referenceDate: Date; // usually requestDate but might be logDate?
  challengeId: string;
};

export type ActiveChallengesStatusCheckPayload = {
  requestDate: Date;
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
  learningPaths?: Nullable<User['learningPaths']>;
  timezone?: Nullable<User['timezone']>;
  preferredReminderTime?: Nullable<User['preferredReminderTime']>;
  notificationPreferences?: Nullable<User['notificationPreferences']>;
};

export type UserProfileResponse = GetUserProfileOperation['response']['body'];

// --- User Metadata DTOs ---
export type UserMetadataResponse = GetUserMetadataOperation['response']['body'];

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
  page: number;
  limit: number;
};

export type GetQuestionDto = {
  questionId: string;
};

export type NewQuestionResponse = SubmitQuestionOperation['response']['body'];
export type ListQuestionsResponse = ListQuestionsOperation['response']['body'][0];
export type GetQuestionResponse = GetQuestionOperation['response']['body'];

// Answer DTOs
export type SubmitAnswerDto = {
  questionId: string;
  answer: string;
  isAnonymous: boolean;
};

export type ListAnswersDto = {
  questionId: string;
  page: number;
  limit: number;
};

export type GetAnswerDto = {
  questionId: string;
  answerId: string;
};

export type NewAnswerResponse = SubmitAnswerOperation['response']['body'];
export type GetAnswerResponse = GetAnswerOperation['response']['body'];
export type ListAnswersResponse = ListAnswersOperation['response']['body'][0];

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

export type NewProgressShareResponse = ShareProgressOperation['response']['body'];

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
  page: number;
  limit: number;
};

export type GetPublicSharesDto = {
  shareType: ProgressShare['shareType'];
  page: number;
  limit: number;
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

export type ProgressSharePublicListResponse = GetPublicSharesOperation['response']['body'][0];
export type ProgressShareDetailResponse = GetShareOperation['response']['body'];
export type ProgressShareUserListResponse = GetUserSharesOperation['response']['body'][0];
export type ProgressShareUserDetailResponse = GetUserShareOperation['response']['body'];

// --- Challenges V2 DTOs ---

export type CreateUserChallengeDto = {
  name: string;
  description: string;
  goals: string[];
  startDate: string; // YYYY-MM-DD
  durationDays: number;
  joinType: 'personal' | 'public' | 'invite-code';
  maxMembers: number;
};

export type UpdateUserChallengeDto = {
  challengeId: string;
  name: string;
  description: string;
  goals: string[];
  startDate: string;
  durationDays: number;
  joinType: 'personal' | 'public' | 'invite-code';
  maxMembers: number;
};

export type JoinChallengeDto = { 
  challengeId: string; 
  inviteCode?: string 
};

export type LeaveChallengeDto = { 
  challengeId: string 
};

export type GetChallengeDto = {
  challengeId: string;
};

export type ListPublicChallengesDto = {
  page: number;
  limit: number;
};

// --- User Challenge Management DTOs ---

export type GetUserChallengeDto = {
  challengeId: string;
};

export type ListChallengesOwnedByUserDto = {
  page: number;
  limit: number;
};

export type ListChallengeJoinedByUserMembersDto = {
  challengeId: string;
  page: number;
  limit: number;
};

export type GetChallengeJoinedByUserSubscriptionDto = {
  challengeId: string;
};

export type ListChallengesJoinedByUserDto = {
  page: number;
  limit: number;
};

export type DeleteUserChallengeDto = {
  challengeId: string;
};

// --- Challenges V2 Response Types ---

export type CreateUserChallengeResponse = CreateUserChallengeOperation['response']['body'];
export type JoinChallengeResponse = JoinChallengeOperation['response']['body'];
export type ChallengeResponse = GetChallengeOperation['response']['body'];
export type ListChallengeResponse = ListPublicChallengesOperation['response']['body'][0];
export type UpdateUserChallengeResponse = UpdateUserChallengeOperation['response']['body'];
export type LeaveChallengeOperationResponse = LeaveChallengeOperation['response']['body'];
export type DeleteUserChallengeOperationResponse = DeleteUserChallengeOperation['response']['body'];
// --- User Challenge Management Response Types ---

export type GetUserChallengeResponse = GetUserChallengeOperation['response']['body'];
export type ListChallengesOwnedByUserResponse = ListChallengesOwnedByUserOperation['response']['body'][0];
export type ListChallengeJoinedByUserMembersResponse = ListChallengeJoinedByUserMembersOperation['response']['body'][0];
export type GetChallengeJoinedByUserSubscriptionResponse = GetChallengeJoinedByUserSubscriptionOperation['response']['body'];
export type ListChallengesJoinedByUserResponse = ListChallengesJoinedByUserOperation['response']['body'][0];

// --- Article Service DTOs ---

export type LogReadDto = { articleId: string };
export type StartQuizDto = { articleId: string };
export type SubmitQuizDto = { articleId: string; quizAnswers: Array<{
  questionId: string;
  answerIndex: number;
  hintUsed: boolean;
}> };
export type RetryQuizDto = { articleId: string; userWantsToRetry?: boolean };
export type StartPracticalDto = { articleId: string };
export type CompletePracticalDto = { articleId: string };
export type SkipPracticalDto = { articleId: string };
export type CompleteArticleDto = { articleId: string };
export type ListUserArticlesDto = { page: number; limit: number };
export type GetUserArticleDto = { articleId: string };

// Response types inferred from consolidated schemas
export type LogReadResponse = LogReadOperation['response']['body'];
export type StartQuizResponse = StartQuizOperation['response']['body'];
export type SubmitQuizResponse = SubmitQuizOperation['response']['body'];
export type RetryQuizResponse = RetryQuizOperation['response']['body'];
export type StartPracticalResponse = StartPracticalOperation['response']['body'];
export type CompletePracticalResponse = CompletePracticalOperation['response']['body'];
export type SkipPracticalResponse = SkipPracticalOperation['response']['body'];
export type CompleteArticleResponse = CompleteArticleOperation['response']['body'];

export type ListUserArticlesResponse = ListUserArticlesOperation['response']['body'];
export type GetUserArticleResponse = GetUserArticleOperation['response']['body'];

// Back-compat aliases for service/consumer code
export type UserArticleSummaryResponse = ListUserArticlesResponse[number];
export type UserArticleDetailResponse = GetUserArticleResponse;

// --- Statistics Response Types ---
export type GlobalStatisticsResponse = GetGlobalStatisticsOperation['response']['body'];
export type ArticleStatisticsResponse = GetArticleStatisticsOperation['response']['body'];
