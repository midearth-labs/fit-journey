// --- Data Structures ---

  import {
    type UserAnswer, 
    type DailyLogPayload, 
  type UserChallenge,
  type AllLogKeysType,
  type LogValueType,
  type User,
} from "$lib/server/db/schema";
// --- Service Types (for Dependency Injection) ---

// --- Auth Context ---
export type AuthRequestContext = {
  requestDate: Date; // the timestamp/instant of the incoming request
  requestId: string; // the requestId UUID of the request
  user: {
    id: string;
    email?: string;
    created_at: string;
  }
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
};;

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
  display_name?: Nullable<User['display_name']>;
  avatar_gender?: Nullable<User['avatar_gender']>;
  avatar_age_range?: Nullable<User['avatar_age_range']>;
  personalizationCountryCodes?: Nullable<User['personalizationCountryCodes']>;
  timezone?: Nullable<User['timezone']>;
  preferred_reminder_time?: Nullable<User['preferred_reminder_time']>;
  notification_preferences?: Nullable<User['notification_preferences']>;
};

export type UserProfileResponse = {
  id: string;
  email?: string;
  display_name: string | null;
  avatar_gender: string | null;
  avatar_age_range: string | null;
  personalizationCountryCodes: string[] | null;
  timezone: string | null;
  preferred_reminder_time: string | null;
  notification_preferences: {
    daily: boolean;
    social: boolean;
    fitness_level: boolean;
  } | null;
};