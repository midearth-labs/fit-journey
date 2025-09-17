// --- Data Structures ---

  import {
    type UserAnswer, 
    type DailyHabitLogPayload, 
  type UserChallenge,
  type AllHabitLogKeysType,
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

export type PutUserChallengeLogDto = {
  logDate: string; // YYYY-MM-DD format
  values: DailyHabitLogPayload;
};

export type ListUserChallengeLogsDto = {
  userChallengeId: string;
  fromDate?: string; // YYYY-MM-DD format
  toDate?: string; // YYYY-MM-DD format
};

export type ListUserChallengeQuizSubmissionsDto = ListUserChallengeLogsDto;

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
  habitsLoggedCount: number;
  lastActivityDate?: string;
  createdAt: string;
  updatedAt: string;
};


export type UserChallengeDetailResponse = UserChallengeSummaryResponse

export type UserHabitLogResponse = {
  logDate: string;
  // @TODO: decouple the database models from the service layer
  values: DailyHabitLogPayload;
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
  activeChallengeHabits: AllHabitLogKeysType[];
};