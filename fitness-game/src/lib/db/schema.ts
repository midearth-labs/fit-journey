import { pgTable, text, timestamp, boolean, integer, date, jsonb, uuid, pgEnum, index, unique } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

// Enums
export const avatarGenderEnum = pgEnum('avatar_gender', ['male', 'female']);
export const avatarAgeRangeEnum = pgEnum('avatar_age_range', ['child', 'teen', 'young-adult', 'middle-age', 'senior']);

/**
 * Describes the structure for a single answer submitted by a user for a quiz.
 * An array of these will be stored in the `quizAnswers` JSONB field.
 */
export type UserAnswer = {
  question_id: string;
  answer_index: number;
  is_correct: boolean;
  hint_used: boolean;
}

/**
 * Defines the lifecycle status of a user's participation in a challenge.
 * (Unchanged from previous design)
 */
export const userChallengeStatusEnum = pgEnum('user_challenge_status', [
  'not_started',
  'active',
  'completed',
  'locked',
  'inactive',
]);

/**
 * Describes the structure for the daily habit log.
 * The key is the `challengeHabitId` (as a string, since JSON keys are strings),
 * and the value is the data logged by the user.
 */
export type DailyHabitLogPayload = {
  workout_completed?: boolean,
  ate_clean?: boolean,
  slept_well?: boolean,
  hydrated?: boolean,
};


// User table - seeded from Supabase Auth table using trigger
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(), // this will be the FK to Supabase Auth table
  email: text('email').notNull().unique(),
  display_name: text('display_name'),
  avatar_gender: avatarGenderEnum('avatar_gender'),
  avatar_age_range: avatarAgeRangeEnum('avatar_age_range'),
  timezone: text('timezone'), // e.g. UTC, UTC+1, UTC-8
  preferred_reminder_time: text('preferred_reminder_time'), // e.g. "19:00"
  notification_preferences: jsonb('notification_preferences').$type<{
    daily: boolean;
    social: boolean;
    fitness_level: boolean;
  }>(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// UserProfile table (which is an extension of the User table)
export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  current_fitness_level: integer('current_fitness_level').notNull().default(0), // -5 to +5 fitness level
  current_streak_ids: jsonb('current_streak_ids').$type<{
    workout_completed?: string;
    ate_clean?: string;
    slept_well?: string;
    hydrated?: string;
    quiz_completed?: string;
    quiz_passed?: string;
    all?: string;
  }>(), // each value is a FK to StreakHistory
  longest_streaks: jsonb('longest_streaks').$type<{
    workout_completed?: string;
    ate_clean?: string;
    slept_well?: string;
    hydrated?: string;
    quiz_completed?: string;
    quiz_passed?: string;
    all?: string;
  }>(), // each value is a FK to StreakHistory
  last_activity_date: timestamp('last_activity_date'), // update this based on completion of daily quiz or logging of habits
  created_at: timestamp('created_at').notNull(),
  updated_at: timestamp('updated_at').notNull(),
});


/**
 * USER CHALLENGES
 * Represents a specific user's instance of a challenge.
 * This table is central to tracking a user's journey.
 */
export const userChallenges = pgTable('user_challenges', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // NOTE: 'challengeId' is just a string. Your application must validate
  // that this ID exists in your static JSON challenge definitions.
  challengeId: text('challenge_id').notNull(),

  startDate: date('start_date').notNull(),
  originalStartDate: date('original_start_date').notNull(),
  status: userChallengeStatusEnum('status').notNull(),

  knowledgeBaseCompletedCount: integer('knowledge_base_completed_count').notNull(),
  habitsLoggedCount: integer('habits_logged_count').notNull(),
  lastActivityDate: timestamp('last_activity_date'),
  
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
}, (table) => {
  return [
    // Index to find challenges by status and startDate
    // @TODO: @NOTE: might not be safe to modify this index after deployment, might be better to create a new index with the new statuses
    // then update the queries, then drop the old index
    index('user_challenge_status_start_date_not_locked_inactive_index').on(table.status, table.startDate)
    .where(sql`${table.status} NOT IN ('locked', 'inactive')`),
  ];
});

/**
 * USER CHALLENGE PROGRESS
 * Tracks a user's progress on a specific article/quiz within their challenge.
 */
// Drizzle Schema
export const userChallengeProgress = pgTable('user_challenge_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  userChallengeId: uuid('user_challenge_id').notNull().references(() => userChallenges.id, { onDelete: 'cascade' }),
  
  // NOTE: 'knowledgeBaseId' corresponds to an ID in your static JSON.
  knowledgeBaseId: text('knowledge_base_id').notNull(),

  allCorrectAnswers: boolean('all_correct_answers').notNull(), // Whether all questions were answered correctly
  
  /**
   * NEW: Stores all user answers for this quiz in a single JSONB field.
   * This is ideal for batch submissions.
   */
  quizAnswers: jsonb('quiz_answers').$type<UserAnswer[]>().notNull(),

  firstAttemptedAt: timestamp('first_attempted_at').notNull(),
  lastAttemptedAt: timestamp('last_attempted_at').notNull(),
  attempts: integer('attempts').notNull(),
}, (table) => {
  return [
    // A user should only have one progress record per article in their challenge.
    unique('user_challenge_article_unique').on(table.userChallengeId, table.knowledgeBaseId),
  ];
});


/**
 * USER HABIT LOGS (Redesigned)
 * This table now stores one row per user, per challenge, per day.
 * All habit data for that day is consolidated into a single JSONB object.
 */
export const userHabitLogs = pgTable('user_habit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  userChallengeId: uuid('user_challenge_id').notNull().references(() => userChallenges.id, { onDelete: 'cascade' }),
  
  // The specific date this log entry is for. CRITICAL for back-logging.
  logDate: date('log_date').notNull(),
  
  /**
   * NEW: A JSONB object holding all habit values for the given day.
   * Example: { "habit_id_1": true, "habit_id_5": 120, "habit_id_7": "Ate a healthy salad" }
   */
  values: jsonb('values').notNull().$type<DailyHabitLogPayload>(),

  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
}, (table) => {
  return [
    // Ensures a user can only have ONE log entry per day for a given challenge.
    // This makes updates (UPSERTs) simple and prevents duplicate data.
    unique('user_daily_log_unique').on(table.userChallengeId, table.logDate),
  ];
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(userProfiles, {
    fields: [users.id],
    references: [userProfiles.id],
  }),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, {
    fields: [userProfiles.id],
    references: [users.id],
  }),
}));

// Export types
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
export type UserProfile = InferSelectModel<typeof userProfiles>;
export type NewUserProfile = InferInsertModel<typeof userProfiles>;
export type UserChallenge = InferSelectModel<typeof userChallenges>;
export type NewUserChallenge = Omit<InferInsertModel<typeof userChallenges>, 'id' | 'updatedAt' | 'lastActivityDate' | 'status' | 'knowledgeBaseCompletedCount' | 'habitsLoggedCount'>;
export type UserChallengeProgress = InferSelectModel<typeof userChallengeProgress>;
export type NewUserChallengeProgress = Omit<InferInsertModel<typeof userChallengeProgress>, 'id' | 'attempts' | 'lastAttemptedAt'>;
export type UserHabitLog = InferSelectModel<typeof userHabitLogs>;
export type NewUserHabitLog = Omit<InferInsertModel<typeof userHabitLogs>, 'id' | 'updatedAt'>;
export type UpdateUserChallenge = Partial<UserChallenge> & Pick<UserChallenge, 'updatedAt' | 'id' | 'userId'>