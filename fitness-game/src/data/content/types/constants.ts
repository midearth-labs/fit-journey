// Content type union for type safety
export const ContentTypes = [
  'ContentCategory',
  'Question',
  'KnowledgeBase',
  'StreakType',
  'AvatarAsset'
] as const;


// Content type union for type safety
export type ContentType = typeof ContentTypes[number];


// Content Directory Names
export const CONTENT_DIRECTORIES = {
  ContentCategory: 'categories',
  Question: 'questions',
  KnowledgeBase: 'knowledge-base',
  StreakType: 'streak-types',
  AvatarAsset: 'avatar-assets'
} as const satisfies Record<ContentType, string>;

// Content Generation Constants
export const CONTENT_GENERATION = {
  DEFAULT_QUESTIONS_PER_CATEGORY: 50,
  DEFAULT_PASSAGES_PER_CATEGORY: 20,
  DEFAULT_KNOWLEDGE_BASE_PER_CATEGORY: 10,
  DEFAULT_DAILY_CHALLENGES: 30,
  DEFAULT_STREAK_TYPES: 7,
  DEFAULT_AVATAR_ASSETS: 20
} as const;

// Time Constants
export const TIME_CONSTANTS = {
  SECONDS_PER_MINUTE: 60,
  MINUTES_PER_HOUR: 60,
  HOURS_PER_DAY: 24,
  DAYS_PER_WEEK: 7,
  DAYS_PER_MONTH: 30,
  DAYS_PER_YEAR: 365
} as const;

// Default Values
export const DEFAULT_VALUES = {
  TIMEZONE: 'UTC-7',
  REMINDER_TIME: '19:00',
  STREAK_GRACE_PERIOD_DAYS: 1,
  MAX_RETRY_ATTEMPTS: 3,
  QUESTION_TIMEOUT_SECONDS: 300, // 5 minutes
  PASSAGE_READ_TIME_MULTIPLIER: 0.5 // minutes per word
} as const;
