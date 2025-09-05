// --- Data Structures ---

import { GameSession } from "@/db/schema"; // Import GameSession type for UserProgressService

export type KnowledgeBaseArticleSummary = {
  id: string;
  day: number;
};

// Key is the question ID, value is an object the correct option index
export type CorrectAssessment = Record<string, { correctOptionIndex: number }>;

export type GameSessionJwtPayload = {
  sub: string; // User ID
  article_id: string;
  day_number: number;
  attempts_count: number;
  iat: number; // Issued At (Unix timestamp)
};

// --- Service Interfaces (for Dependency Injection) ---

export interface IKnowledgeBaseService {
  getArticleForDay(day: number): Promise<KnowledgeBaseArticleSummary | null>;
  getAssessmentForArticle(articleId: string): Promise<CorrectAssessment | null>;
  getMaxProgressionDay(): number; // Added to define the upper limit of the progression
}

export interface IJwtService {
  sign(payload: Record<string, any>, expiresIn: string | number): string;
  verify<T>(token: string): T;
}

export interface IUserProgressService {
  // Method to determine the current day for the user's progression
  getCurrentDayForUser(userId: string): Promise<number>; 
  // You might have other methods here, like updating user's max completed day etc.
}

export interface IUserTimezoneService {
  // Returns the user's current timezone string (e.g., "America/New_York", "Europe/London")
  getUserTimezone(userId: string): Promise<string>;
}

export interface IDateTimeService {
  getUtcNow(): Date; // Returns current UTC Date object
  getUnixTimestamp(date: Date): number;
  getUtcDateString(date?: Date): string; // Returns YYYY-MM-DD format
}

// --- DTOs for Service Methods ---

export type StartSessionDto = {
  userId: string;
};

export type SubmitAnswersDto = {
  userId: string; // Authenticated user ID
  sessionToken: string;
  userAnswers: {
    questionId: string;
    selectedOptionIndex: number;
    hintUsed: boolean;
  }[];
};

export type ListUserSessionsDto = {
  userId: string;
  page: number;
  limit: number;
};

// --- Output Types for Service Methods ---

export type StartSessionOutput = 
  | { status: 'completed' }
  | { 
      status: 'in-progress'; 
      sessionToken: string;
      articleSummary: KnowledgeBaseArticleSummary;
    };

export type SubmitAnswersOutput =
  | { status: 'completed'; }
  | { 
      status: 'retry'; 
      retriesLeft: number;
      incorrectQuestions: string[];
      newSessionToken: string;
    }
  | { status: 'failed'; };

// --- Streak Management Interfaces ---

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

export interface IStreakService {
  logHabits(dto: HabitLogDto): Promise<StreakCalculationResult>;
  logQuizCompletion(dto: QuizCompletionDto): Promise<StreakCalculationResult>;
  getCurrentStreaks(userId: string): Promise<Record<StreakType, number>>;
}

export interface IFitnessLevelService {
  calculateFitnessLevel(dto: FitnessLevelCalculationDto): Promise<FitnessLevelResult>;
  getFitnessLevelHistory(userId: string, limit?: number): Promise<any[]>;
}

// --- Streak DTOs ---

export type HabitLogDto = {
  userId: string;
  habits: Record<HabitType, boolean>;
};

export type QuizCompletionDto = {
  userId: string;
  allCorrect: boolean;
};

export type FitnessLevelCalculationDto = {
  userId: string;
  quizPerformance?: {
    accuracy: number; // 0-1
    consistency: number; // 0-1
  };
};

// --- Streak Result Types ---

export type StreakCalculationResult = {
  habitType: StreakType;
  completed: boolean;
  currentStreakLength: number;
  isNewStreak: boolean;
  isStreakExtended: boolean;
};

export type FitnessLevelResult = {
  newFitnessLevel: number; // -5 to +5
  previousFitnessLevel: number;
  levelChanged: boolean;
  calculationDate: Date;
};

// --- Repository Interfaces ---

export interface IStreakLogRepository {
  create(logData: any): Promise<any>;
  update(logId: string, updates: any): Promise<any>;
  findByUserAndDate(userId: string, dateUtc: string): Promise<any>;
  findByUserInDateRange(userId: string, startDate: string, endDate: string): Promise<any[]>;
  findLatestByUser(userId: string): Promise<any>;
  findByUser(userId: string, limit?: number): Promise<any[]>;
}

export interface IStreakHistoryRepository {
  create(historyData: any): Promise<any>;
  update(historyId: string, updates: any): Promise<any>;
  findById(historyId: string): Promise<any>;
  findCurrentStreakByUserAndType(userId: string, streakType: string): Promise<any>;
  findLongestStreakByUserAndType(userId: string, streakType: string): Promise<any>;
  findByUserAndType(userId: string, streakType: string, limit?: number): Promise<any[]>;
  findByUser(userId: string, limit?: number): Promise<any[]>;
}

export interface IFitnessLevelHistoryRepository {
  create(historyData: any): Promise<any>;
  findByUser(userId: string, limit?: number): Promise<any[]>;
  findLatestByUser(userId: string): Promise<any>;
}

