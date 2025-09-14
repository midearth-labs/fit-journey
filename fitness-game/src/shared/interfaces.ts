// --- Data Structures ---

  import {
  UserAnswer, 
  DailyHabitLogPayload, 
  UserChallenge,
} from "@/db/schema";
import { Challenge } from "@/data/content/types/challenge";
// --- Service Types (for Dependency Injection) ---

// --- Auth Context ---
export type AuthRequestContext = {
  requestDate: Date; // the timestamp/instant of the incoming request
  userId: string; // the userId of the user session
};

export type DatesOnEarthAtInstant = { earliest: string, utc: string, latest: string };
export type Offsets = {
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
  milliseconds?: number;
}

// --- Streak Management Interfaces ---

// @TODO: synchronize DailyHabitLogPayload with HabitType
export type HabitType = 
| 'workout_completed'
| 'ate_clean' 
| 'slept_well'
| 'hydrated';

export type QuizType = 
  | 'quiz_completed'
  | 'quiz_passed';

  export type StreakType = 
    | HabitType
    | QuizType
    | 'all';

// --- Streak DTOs ---

export type HabitLogDto = {
  userId: string;
  habits: Record<HabitType, boolean>;
};

export type QuizCompletionDto = {
  userId: string;
  allCorrect: boolean;
};

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
  userChallengeId: string;
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
  id: string;
  userChallengeId: string;
  logDate: string;
  // @TODO: decouple the database models from the service layer
  values: DailyHabitLogPayload;
  createdAt: string;
  updatedAt: string;
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
  requestDate: Date;
  challengeDays: number;
};

export type UserChallengeWithImplicitStatus = UserChallenge & {
  implicitStatus: (payload: ImplicitStatusCheckPayload) => UserChallenge['status'];
};
