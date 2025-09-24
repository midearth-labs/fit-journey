// --- Data Structures ---

import {
  type UserAnswer, 
  type DailyLogPayload, 
  type UserChallenge,
  type AllLogKeysType,
  type User,
  type ProgressShare,
} from "$lib/server/db/schema";
import {
  type GetUserProfileOperation,
  type ListUserLogsOperation,
  type CreateUserChallengeOperation,
  type ListUserChallengesOperation,
  type GetUserChallengeOperation,
  type ListUserChallengeQuizSubmissionsOperation,
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
  type CreateChallengeOperation,
  type UpdateChallengeOperation,
  type JoinChallengeOperation,
  type LeaveChallengeOperation,
  type GetChallengeOperation,
  type ListPublicChallengesOperation,
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

export type NewUserChallengeResponse = CreateUserChallengeOperation['response']['body'];
export type UserChallengeSummaryResponse = ListUserChallengesOperation['response']['body'][0];
export type UserChallengeDetailResponse = GetUserChallengeOperation['response']['body'];
export type UserLogResponse = ListUserLogsOperation['response']['body'][0];
export type UserChallengeProgressResponse = ListUserChallengeQuizSubmissionsOperation['response']['body'][0];

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

export type UserProfileResponse = GetUserProfileOperation['response']['body'];

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
  page?: number;
  limit?: number;
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

export type ProgressSharePublicListResponse = GetPublicSharesOperation['response']['body'][0];
export type ProgressShareDetailResponse = GetShareOperation['response']['body'];
export type ProgressShareUserListResponse = GetUserSharesOperation['response']['body'][0];
export type ProgressShareUserDetailResponse = GetUserShareOperation['response']['body'];

// --- Challenges V2 DTOs ---

export type CreateChallengeDto = {
  name: string;
  description: string;
  goals: string[];
  startDate: string; // YYYY-MM-DD
  durationDays: number;
  joinType: 'personal' | 'public' | 'invite-code';
  maxMembers?: number; // default based on joinType
};

export type UpdateChallengeDto = {
  challengeId: string;
  name?: string;
  description?: string | null;
  goals?: string[];
  startDate?: string;
  durationDays?: number;
  joinType?: 'personal' | 'public' | 'invite-code';
  maxMembers?: number;
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

// --- Challenges V2 Response Types ---

export type CreateChallengeResponse = CreateChallengeOperation['response']['body'];
export type JoinChallengeResponse = JoinChallengeOperation['response']['body'];
export type ChallengeResponse = GetChallengeOperation['response']['body'];
export type ListChallengeResponse = ListPublicChallengesOperation['response']['body'][0];
