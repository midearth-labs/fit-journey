// Content type union for type safety
export const ContentTypes = [
  'ContentCategory',
  'Question',
  'KnowledgeBase',
  //'StreakType',
  //'AvatarAsset',
  'Challenge'
] as const;


// Content type union for type safety
export type ContentType = typeof ContentTypes[number];


// Content Directory Names
export const CONTENT_DIRECTORIES = {
  ContentCategory: 'categories',
  Question: 'questions',
  KnowledgeBase: 'knowledge-base',
  //StreakType: 'streak-types',
  //AvatarAsset: 'avatar-assets',
  Challenge: 'challenges',
} as const satisfies Record<ContentType, string>;

// Content Generation Constants
export const CHALLENGE_CONSTANTS = {
  DEFAULT_CHALLENGE_GRACE_PERIOD_HOURS: 48,
  MAX_CHALLENGE_DURATION_DAYS: 100,
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
