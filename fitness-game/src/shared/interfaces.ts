// --- Data Structures ---

  import {
  UserAnswer, 
  DailyHabitLogPayload, 
  UserChallenge, 
  NewUserChallenge, 
  UserChallengeProgress, 
  NewUserChallengeProgress, 
  UserHabitLog, 
  NewUserHabitLog,
  UpdateUserChallenge
} from "@/db/schema";
import { Challenge } from "@/data/content/types/challenge";
// --- Service Types (for Dependency Injection) ---

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
  userId: string;
  challengeId: string;
  startDate: string; // YYYY-MM-DD format
};

export type UpdateUserChallengeScheduleDto = {
  userId: string;
  userChallengeId: string;
  newStartDate: string; // YYYY-MM-DD format
};

export type SubmitUserChallengeQuizDto = {
  userId: string;
  userChallengeId: string;
  knowledgeBaseId: string;
  quizAnswers: UserAnswer[];
  overrideSubmission?: boolean;
};

export type PutUserChallengeLogDto = {
  userId: string;
  userChallengeId: string;
  logDate: string; // YYYY-MM-DD format
  values: DailyHabitLogPayload;
};

export type ListUserChallengeLogsDto = {
  userId: string;
  userChallengeId: string;
  fromDate?: string; // YYYY-MM-DD format
  toDate?: string; // YYYY-MM-DD format
};

// --- Challenge Response Types ---

export type UserChallengeResponse = {
  id: string;
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
  challenge?: Challenge; // Static challenge data
  progress?: UserChallengeProgress[]; // User's progress on articles
  logs?: UserHabitLog[]; // User's habit logs
};

export type UserHabitLogResponse = {
  id: string;
  userChallengeId: string;
  logDate: string;
  values: DailyHabitLogPayload;
  createdAt: string;
  updatedAt: string;
};


