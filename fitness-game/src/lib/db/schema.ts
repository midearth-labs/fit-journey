import { pgTable, text, timestamp, boolean, integer, date, jsonb, uuid, pgEnum, index, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

// Enums
export const avatarGenderEnum = pgEnum('avatar_gender', ['male', 'female']);
export const avatarAgeRangeEnum = pgEnum('avatar_age_range', ['child', 'teen', 'young-adult', 'middle-age', 'senior']);

export type UserAnswer = {
  question_id: string;
  answer_index: number;
  is_correct: boolean;
  hint_used: boolean;
}

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
  latest_game_session: uuid('latest_game_session').references(() => gameSessions.id),
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
  last_activity_date: date('last_activity_date'), // update this based on completion of daily quiz or logging of habits
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// GameSession table
export const gameSessions = pgTable('game_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  day: integer('day').notNull(), // FK to KnowledgeBase.day (stored as JSON file)
  knowledge_base_article_id: uuid('knowledge_base_article_id').notNull(),
  started_at: timestamp('started_at', { withTimezone: true }).notNull(),
  completed_at: timestamp('completed_at', { withTimezone: true }).notNull(),
  user_answers: jsonb('user_answers').$type<Array<UserAnswer>>().notNull(),
  all_correct_answers: boolean('all_correct_answers').notNull(), // Whether all questions were answered correctly
  time_spent_seconds: integer('time_spent_seconds').notNull(),
  attempt_count: integer('attempt_count').notNull(), // default: 1. If at a submission, a user doesn't answer all questions correctly, they can try again up to 3 times before the current day ends
  created_at: timestamp('created_at', { withTimezone: true }).notNull(),
}, (table) => ([
  // Unique index for querying game sessions by user and day
  unique('game_sessions_user_id_day_idx').on(table.user_id, table.day),
]));

// StreakLog table
export const streakLogs = pgTable('streak_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  date_utc: date('date_utc').notNull(), // YYYY-MM-DD
  entries: jsonb('entries').$type<{
    workout_completed?: boolean;
    ate_clean?: boolean;
    slept_well?: boolean;
    hydrated?: boolean;
    quiz_completed?: boolean;
    quiz_passed?: boolean;
    all?: boolean;
  }>().notNull(),
  logged_at: timestamp('logged_at').defaultNow().notNull(),
});

// StreakHistory table
export const streakHistories = pgTable('streak_histories', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  streak_length: integer('streak_length').notNull(),
  started_date: date('started_date').notNull(),
  ended_date: date('ended_date'), // null if current streak
  streak_type: text('streak_type').notNull(), // FK to StreakType (stored as JSON file)
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// FitnessLevelHistory table
export const fitnessLevelHistories = pgTable('fitness_level_histories', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  fitness_level: integer('fitness_level').notNull(), // -5 to +5 fitness level
  calculated_at: timestamp('calculated_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(userProfiles, {
    fields: [users.id],
    references: [userProfiles.user_id],
  }),
  gameSessions: many(gameSessions),
  streakLogs: many(streakLogs),
  streakHistories: many(streakHistories),
  fitnessLevelHistories: many(fitnessLevelHistories),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, {
    fields: [userProfiles.user_id],
    references: [users.id],
  }),
  latestGameSession: one(gameSessions, {
    fields: [userProfiles.latest_game_session],
    references: [gameSessions.id],
  }),
}));

export const gameSessionsRelations = relations(gameSessions, ({ one }) => ({
  user: one(users, {
    fields: [gameSessions.user_id],
    references: [users.id],
  }),
}));

export const streakLogsRelations = relations(streakLogs, ({ one }) => ({
  user: one(users, {
    fields: [streakLogs.user_id],
    references: [users.id],
  }),
}));

export const streakHistoriesRelations = relations(streakHistories, ({ one }) => ({
  user: one(users, {
    fields: [streakHistories.user_id],
    references: [users.id],
  }),
}));

export const fitnessLevelHistoriesRelations = relations(fitnessLevelHistories, ({ one }) => ({
  user: one(users, {
    fields: [fitnessLevelHistories.user_id],
    references: [users.id],
  }),
}));

// Export types
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
export type UserProfile = InferSelectModel<typeof userProfiles>;
export type NewUserProfile = InferInsertModel<typeof userProfiles>;
export type GameSession = InferSelectModel<typeof gameSessions>;
export type NewGameSession = InferInsertModel<typeof gameSessions>;
export type StreakLog = InferSelectModel<typeof streakLogs>;
export type NewStreakLog = InferInsertModel<typeof streakLogs>;
export type StreakHistory = InferSelectModel<typeof streakHistories>;
export type NewStreakHistory = InferInsertModel<typeof streakHistories>;
export type FitnessLevelHistory = InferSelectModel<typeof fitnessLevelHistories>;
export type NewFitnessLevelHistory = InferInsertModel<typeof fitnessLevelHistories>;
