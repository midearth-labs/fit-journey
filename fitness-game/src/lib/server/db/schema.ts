import { pgTable, text, timestamp, boolean, integer, date, jsonb, uuid, pgEnum, index, unique, uniqueIndex, primaryKey } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { type InferSelectModel, type InferInsertModel } from 'drizzle-orm';

export const FiveStarLogKeys = ['dailyMovement', 'cleanEating', 'sleepQuality', 'hydration'] as const;
export const AllLogKeys = [...FiveStarLogKeys] as const;
// Enums
export const avatarGenderEnum = pgEnum('avatar_gender', ['male', 'female']);
export const avatarAgeRangeEnum = pgEnum('avatar_age_range', ['child', 'teen', 'young-adult', 'middle-age', 'senior']);
export const allLogKeysEnum = pgEnum('all_log_keys', AllLogKeys);
export const recentActiveSharesInterval = '48 hours';
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

// Social Features Enums
export const questionStatusEnum = pgEnum('question_status', ['pending', 'approved', 'rejected', 'hidden']);
export const answerStatusEnum = pgEnum('answer_status', ['pending', 'approved', 'rejected', 'hidden']);
export const reactionTypeEnum = pgEnum('reaction_type', ['helpful', 'not_helpful']);
export const emojiReactionEnum = pgEnum('emoji_reaction_type', ['clap', 'muscle', 'party']);
export const shareTypeEnum = pgEnum('share_type', ['challenge_completion', 'avatar_progression', 'quiz_achievement']);
export const shareStatusEnum = pgEnum('share_status', ['active', 'hidden', 'deleted']);

export type AllLogKeysType = (typeof AllLogKeys)[number];
export const FiveStarValues = [1, 2, 3, 4, 5] as const;
export type FiveStarValuesType = (typeof FiveStarValues)[number];
export const YesNoValues = [1, 0] as const;
export type YesNoValuesType = (typeof YesNoValues)[number];

type Satisfies<Constraint, Target extends Constraint> = Target;
type SharedType = Record<AllLogKeysType, 
  LogValueType<FiveStarValuesType> | 
  LogValueType<YesNoValuesType>>;

export type LogValueType<V extends number> = V | null | undefined;

// @TODO LATER: TIGHTEN THIS TYPE USING CONDITIONAL TYPES (KEYOF / NEVER ETC)
export type DailyLogPayload = Satisfies<Partial<SharedType>, {
  dailyMovement?: LogValueType<FiveStarValuesType>,
  cleanEating?: LogValueType<FiveStarValuesType>,
  sleepQuality?: LogValueType<FiveStarValuesType>,
  hydration?: LogValueType<FiveStarValuesType>,
}>;


// User table - seeded from Supabase Auth table using trigger
// For user profile submitted information
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(), // this will be the FK to Supabase Auth table
  email: text('email').notNull().unique(),
  display_name: text('display_name'),
  avatar_gender: avatarGenderEnum('avatar_gender'),
  avatar_age_range: avatarAgeRangeEnum('avatar_age_range'),
  // country codes for content personalization.
  personalizationCountryCodes: jsonb('personalization_country_codes').$type<string[]>(),
  timezone: text('timezone'), // e.g. UTC, UTC+1, UTC-8
  preferred_reminder_time: text('preferred_reminder_time'), // e.g. "19:00"
  notification_preferences: jsonb('notification_preferences').$type<{
    daily: boolean;
    social: boolean;
    fitness_level: boolean;
  }>(),
  // Social Features Fields
  invitationCode: uuid('invitation_code').unique(),
  invitationJoinCount: integer('invitation_join_count').notNull().default(0),
  inviterUserId: uuid('inviter_user_id').references((): any => users.id, { onDelete: 'set null' }),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table): any => {
  return [
    index('users_invitation_code_index').on(table.invitationCode),
    index('users_inviter_index').on(table.inviterUserId),
  ];
});

// UserMetadata table (which is an extension of the User table for non-user submitted information)
export const userMetadata = pgTable('user_metadata', {
  id: uuid('id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  current_fitness_level: integer('current_fitness_level').notNull().default(0), // -5 to +5 fitness level
  current_streak_ids: jsonb('current_streak_ids').$type<{
    dailyMovement?: string;
    cleanEating?: string;
    sleepQuality?: string;
    hydration?: string;
    quizCompleted?: string;
    quizPassed?: string;
    all?: string;
  }>(), // each value is a FK to StreakHistory
  longest_streaks: jsonb('longest_streaks').$type<{
    dailyMovement?: string;
    cleanEating?: string;
    sleepQuality?: string;
    hydration?: string;
    quizCompleted?: string;
    quizPassed?: string;
    all?: string;
  }>(), // each value is a FK to StreakHistory
  last_activity_date: timestamp('last_activity_date'), // update this based on completion of daily quiz or logging of habits, weight, RHR etc
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
  dailyLogCount: integer('daily_log_count').notNull(),
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
    
    // Unique index to ensure a user can only have one challenge per challengeId when status is not locked or inactive
    uniqueIndex('user_challenge_unique_active_index').on(table.userId, table.challengeId)
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

export const userLogs = pgTable('user_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  logKey: allLogKeysEnum('log_key').notNull(),
  logValue: integer('log_value').notNull(),
  // The specific date this log entry is for. CRITICAL for back-logging.
  logDate: date('log_date').notNull(),
  // logNotes: text('log_notes'),

  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
}, (table) => {
  return [
    // Ensures a user can only have ONE log entry per day per user.
    // This makes updates (UPSERTs) simple and prevents duplicate data.
    unique('user_daily_log_unique').on(table.userId, table.logDate, table.logKey),
  ];
});

// Social Features Tables

// Questions table
export const questions = pgTable('questions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  body: text('body').notNull(),
  isAnonymous: boolean('is_anonymous').notNull(),
  status: questionStatusEnum('status').notNull(),
  moderationNotes: jsonb('moderation_notes').$type<{title: string[], body: string[]}>().notNull(),
  helpfulCount: integer('helpful_count').notNull(),
  notHelpfulCount: integer('not_helpful_count').notNull(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
}, (table) => {
  return [
    index('questions_status_index').on(table.status),
    index('questions_approved_index').on(table.status).where(sql`${table.status} = 'approved'`),
    index('questions_user_index').on(table.userId),
  ];
});

// Question Articles junction table (many-to-many relationship)
export const questionArticles = pgTable('question_articles', {
  questionId: uuid('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
  articleId: text('article_id').notNull(),
  createdAt: timestamp('created_at').notNull(),
}, (table) => {
  return [
    primaryKey({ columns: [table.questionId, table.articleId] }),
    index('question_articles_question_index').on(table.questionId),
    index('question_articles_article_index').on(table.articleId),
  ];
});

// Question Answers table
export const questionAnswers = pgTable('question_answers', {
  id: uuid('id').primaryKey().defaultRandom(),
  questionId: uuid('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  answer: text('answer').notNull(),
  isAnonymous: boolean('is_anonymous').notNull(),
  status: answerStatusEnum('status').notNull(),
  moderationNotes: jsonb('moderation_notes').$type<{answer: string[]}>().notNull(),
  helpfulCount: integer('helpful_count').notNull(),
  notHelpfulCount: integer('not_helpful_count').notNull(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
}, (table) => {
  return [
    index('question_answers_question_index').on(table.questionId),
    index('question_answers_approved_index').on(table.status).where(sql`${table.status} = 'approved'`),
    index('question_answers_user_index').on(table.userId),
  ];
});

// Question Reactions table
export const questionReactions = pgTable('question_reactions', {
  questionId: uuid('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  reactionType: reactionTypeEnum('reaction_type').notNull(),
  createdAt: timestamp('created_at').notNull(),
}, (table) => {
  return [
    primaryKey({ columns: [table.questionId, table.userId] }), // Composite primary key
    index('question_reactions_question_index').on(table.questionId),
  ];
});

// Answer Reactions table
export const answerReactions = pgTable('answer_reactions', {
  answerId: uuid('answer_id').notNull().references(() => questionAnswers.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  reactionType: reactionTypeEnum('reaction_type').notNull(),
  createdAt: timestamp('created_at').notNull(),
}, (table) => {
  return [
    primaryKey({ columns: [table.answerId, table.userId] }), // Composite primary key
    index('answer_reactions_answer_index').on(table.answerId),
  ];
});

// Progress Shares table
export const progressShares = pgTable('progress_shares', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  shareType: shareTypeEnum('share_type').notNull(),
  shareTypeId: text('share_type_id'),
  title: text('title').notNull(),
  contentVersion: text('content_version').notNull(),
  generatedContent: jsonb('generated_content').notNull(),
  includeInviteLink: boolean('include_invite_link').notNull(),
  isPublic: boolean('is_public').notNull(),
  status: shareStatusEnum('status').notNull(),
  clapCount: integer('clap_count').notNull(),
  muscleCount: integer('muscle_count').notNull(),
  partyCount: integer('party_count').notNull(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
}, (table) => {
  return [
    index('progress_shares_user_index').on(table.userId, table.updatedAt),
    
    index('progress_shares_type_status_index').on(table.shareType, table.status, table.createdAt),
    index('progress_shares_type_id_index').on(table.shareType, table.shareTypeId),
    // Index to find recent public active shares (last 48 hours)
    index('progress_shares_recent_active_index').on(table.shareType, table.createdAt)
      .where(sql`${table.status} = 'active' AND ${table.isPublic} = true AND ${table.createdAt} >= NOW() - INTERVAL '${recentActiveSharesInterval}'`),
  ];
});

// Note: Share reactions are public and don't need individual tracking
// We just update the count fields directly on progressShares table

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(userMetadata, {
    fields: [users.id],
    references: [userMetadata.id],
  }),
  inviter: one(users, {
    fields: [users.inviterUserId],
    references: [users.id],
  }),
  questions: many(questions),
  questionAnswers: many(questionAnswers),
  progressShares: many(progressShares),
  questionReactions: many(questionReactions),
  answerReactions: many(answerReactions),
}));

export const userProfilesRelations = relations(userMetadata, ({ one }) => ({
  user: one(users, {
    fields: [userMetadata.id],
    references: [users.id],
  }),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  user: one(users, {
    fields: [questions.userId],
    references: [users.id],
  }),
  articles: many(questionArticles),
  answers: many(questionAnswers),
  reactions: many(questionReactions),
}));

export const questionArticlesRelations = relations(questionArticles, ({ one }) => ({
  question: one(questions, {
    fields: [questionArticles.questionId],
    references: [questions.id],
  }),
}));

export const questionAnswersRelations = relations(questionAnswers, ({ one, many }) => ({
  question: one(questions, {
    fields: [questionAnswers.questionId],
    references: [questions.id],
  }),
  user: one(users, {
    fields: [questionAnswers.userId],
    references: [users.id],
  }),
  reactions: many(answerReactions),
}));

export const questionReactionsRelations = relations(questionReactions, ({ one }) => ({
  question: one(questions, {
    fields: [questionReactions.questionId],
    references: [questions.id],
  }),
  user: one(users, {
    fields: [questionReactions.userId],
    references: [users.id],
  }),
}));

export const answerReactionsRelations = relations(answerReactions, ({ one }) => ({
  answer: one(questionAnswers, {
    fields: [answerReactions.answerId],
    references: [questionAnswers.id],
  }),
  user: one(users, {
    fields: [answerReactions.userId],
    references: [users.id],
  }),
}));

export const progressSharesRelations = relations(progressShares, ({ one }) => ({
  user: one(users, {
    fields: [progressShares.userId],
    references: [users.id],
  }),
}));

// Export types
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
export type UserMetadata = InferSelectModel<typeof userMetadata>;
export type NewUserMetadata = InferInsertModel<typeof userMetadata>;
export type UserChallenge = InferSelectModel<typeof userChallenges>;
export type NewUserChallenge = Omit<InferInsertModel<typeof userChallenges>, 'id' | 'updatedAt' | 'lastActivityDate' | 'status' | 'knowledgeBaseCompletedCount' | 'dailyLogCount'>;
export type UserChallengeProgress = InferSelectModel<typeof userChallengeProgress>;
export type NewUserChallengeProgress = Omit<InferInsertModel<typeof userChallengeProgress>, 'id' | 'attempts' | 'lastAttemptedAt'>;
export type UserLog = InferSelectModel<typeof userLogs>;
export type NewUserLog = Omit<InferInsertModel<typeof userLogs>, 'id' | 'updatedAt'>;
export type UpdateUserChallenge = Partial<UserChallenge> & Pick<UserChallenge, 'updatedAt' | 'id' | 'userId'>;

// Social Features Types
export type Question = InferSelectModel<typeof questions>;
export type NewQuestion = Omit<InferInsertModel<typeof questions>, 'id' | 'updatedAt' | 'helpfulCount' | 'notHelpfulCount'>;
export type QuestionArticle = InferSelectModel<typeof questionArticles>;
export type NewQuestionArticle = InferInsertModel<typeof questionArticles>;
export type QuestionAnswer = InferSelectModel<typeof questionAnswers>;
export type NewQuestionAnswer = Omit<InferInsertModel<typeof questionAnswers>, 'id' | 'updatedAt' | 'helpfulCount' | 'notHelpfulCount'>;
export type QuestionReaction = InferSelectModel<typeof questionReactions>;
export type NewQuestionReaction = InferInsertModel<typeof questionReactions>;
export type AnswerReaction = InferSelectModel<typeof answerReactions>;
export type NewAnswerReaction = InferInsertModel<typeof answerReactions>;
export type ProgressShare = InferSelectModel<typeof progressShares>;
export type NewProgressShare = Omit<InferInsertModel<typeof progressShares>, 'id' | 'updatedAt' | 'clapCount' | 'muscleCount' | 'partyCount' | 'status'>;
