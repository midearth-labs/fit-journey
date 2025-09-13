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
  StreakLog,
  NewStreakLog,
  StreakHistory,
  NewStreakHistory,
  FitnessLevelHistory,
  NewFitnessLevelHistory,
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

export type IDateTimeService = {
  getUtcNow(): Date; // Returns current UTC Date object
  getUnixTimestamp(date: Date): number;
  getUtcDateString(date?: Date): string; // Returns YYYY-MM-DD format
  
  // Challenge-specific date methods
  getTodayUtcDateString(): string; // Returns today's date in YYYY-MM-DD format
  getTwoWeeksFromTodayUtcDateString(): string; // Returns date 2 weeks from today
  getOneMonthFromDateUtcDateString(fromDate: string): string; // Returns date 1 month from given date
  getFortyEightHoursAgoUtcTimestamp(): Date; // Returns timestamp 48 hours ago
  isDateInFuture(dateString: string): boolean; // Check if date is in the future
  isDateBeforeStartDate(logDate: string, startDate: string): boolean; // Check if log date is before start date
  getChallengeEndDateUtcDateString(startDate: string, durationDays: number): string; // Calculate challenge end date
  isDateAfterChallengeEndDate(currentDate: string, endDate: string): boolean; // Check if current date is after challenge end
  getMaxLoggingDateUtcDateString(startDate: string, durationDays: number): string; // Get max date user can log habits
  isLogDateWithinChallengePeriod(logDate: string, startDate: string, durationDays: number): boolean; // Check if log date is within challenge period
  getPossibleDatesOnEarthAtInstant(instant: Date): DatesOnEarthAtInstant; // Get all possible actual dates (YYYY-MM-DD) on earth at the time of the input date
  getDatesFromInstantWithOffset(instant: Date, offsets: Offsets): DatesOnEarthAtInstant;
};

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

export type IStreakService = {
  logHabits(dto: HabitLogDto): Promise<StreakCalculationResult[]>;
  logQuizCompletion(dto: QuizCompletionDto): Promise<StreakCalculationResult>;
  getCurrentStreaks(userId: string): Promise<Record<StreakType, number>>;
};

export type IFitnessLevelService = {
  calculateFitnessLevel(dto: FitnessLevelCalculationDto): Promise<FitnessLevelResult>;
  getFitnessLevelHistory(userId: string, limit?: number): Promise<FitnessLevelHistory[]>;
};

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

export type IStreakLogRepository = {
  create(logData: NewStreakLog): Promise<StreakLog>;
  update(logId: string, userId: string, updates: Partial<StreakLog>): Promise<StreakLog | null>;
  findByUserAndDate(userId: string, dateUtc: string): Promise<StreakLog | null>;
  findByUserInDateRange(userId: string, startDate: string, endDate: string): Promise<StreakLog[]>;
  findLatestByUser(userId: string): Promise<StreakLog | null>;
  findByUser(userId: string, limit?: number): Promise<StreakLog[]>;
};

export type IStreakHistoryRepository = {
  create(historyData: NewStreakHistory): Promise<StreakHistory>;
  update(historyId: string, userId: string, updates: Partial<StreakHistory>): Promise<StreakHistory | null>;
  findById(historyId: string, userId: string): Promise<StreakHistory | null>;
  findCurrentStreakByUserAndType(userId: string, streakType: string): Promise<StreakHistory | null>;
  findLongestStreakByUserAndType(userId: string, streakType: string): Promise<StreakHistory | null>;
  findByUserAndType(userId: string, streakType: string, limit?: number): Promise<StreakHistory[]>;
  findByUser(userId: string, limit?: number): Promise<StreakHistory[]>;
};

export type IFitnessLevelHistoryRepository = {
  create(historyData: NewFitnessLevelHistory): Promise<FitnessLevelHistory>;
  findByUser(userId: string, limit?: number): Promise<FitnessLevelHistory[]>;
  findLatestByUser(userId: string): Promise<FitnessLevelHistory | null>;
};

// --- Challenge System Types ---

export type IUserChallengeRepository = {
  create(challengeData: NewUserChallenge): Promise<UserChallenge>;
  findById(id: string, userId: string): Promise<UserChallenge | null>;
  findByUserId(userId: string): Promise<UserChallenge[]>;
  findActiveByUserId(userId: string): Promise<UserChallenge | null>;
  update(updates: UpdateUserChallenge): Promise<UserChallenge | null>;
  delete(id: string, userId: string): Promise<boolean>;
};

export type IUserChallengeProgressRepository = {
  findByUserChallengeId(userChallengeId: string, userId: string): Promise<UserChallengeProgress[]>;
  findByUserChallengeAndArticle(userChallengeId: string, userId: string, knowledgeBaseId: string): Promise<UserChallengeProgress | null>;
  upsert(progressData: NewUserChallengeProgress): Promise<UserChallengeProgress | null>;
};

export type IUserHabitLogsRepository = {
  upsert(logData: NewUserHabitLog): Promise<UserHabitLog | null>;
  findByUserChallengeId(userChallengeId: string, userId: string): Promise<UserHabitLog[]>;
  findByUserChallengeAndDateRange(userChallengeId: string, userId: string, fromDate?: string, toDate?: string): Promise<UserHabitLog[]>;
  findByUserChallengeAndDate(userChallengeId: string, userId: string, logDate: string): Promise<UserHabitLog | null>;
  delete(id: string, userId: string): Promise<boolean>;
};

export type IChallengeService = {
  createUserChallenge(dto: CreateUserChallengeDto): Promise<UserChallengeResponse>;
  getUserChallenge(userChallengeId: string, userId: string): Promise<UserChallengeResponse>;
  updateUserChallengeSchedule(dto: UpdateUserChallengeScheduleDto): Promise<UserChallengeResponse>;
  submitUserChallengeQuiz(dto: SubmitUserChallengeQuizDto): Promise<void>;
  putUserChallengeLog(dto: PutUserChallengeLogDto): Promise<void>;
  listUserChallengeLogs(dto: ListUserChallengeLogsDto): Promise<UserHabitLogResponse[]>;
  updateChallengeStatuses(): Promise<void>;
};

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
  status: 'not_started' | 'active' | 'completed' | 'locked';
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

// --- Challenge Content Management ---

export type IChallengeContentService = {
  getChallengeById(challengeId: string): Promise<Challenge>;
  getAllChallenges(): Promise<Challenge[]>;
  validateChallengeExists(challengeId: string): Promise<boolean>;
  getChallengeDuration(challengeId: string): number | null;
  getChallengeArticles(challengeId: string): Challenge['articles'] | null;
  getChallengeHabits(challengeId: string): Challenge['habits'] | null;
  isArticleInChallenge(challengeId: string, knowledgeBaseId: string): boolean;
};

