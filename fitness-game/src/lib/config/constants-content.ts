// Content type union for type safety
export const ContentTypes = [
  'ContentCategory',
  'Question',
  'KnowledgeBase',
  'LogType',
  //'AvatarAsset',
  'LearningPath',
  'PersonaQuestion'
] as const;


// Content type union for type safety
export type ContentType = typeof ContentTypes[number];


// Content Directory Names
export const CONTENT_DIRECTORIES = {
  ContentCategory: 'categories',
  Question: 'questions',
  KnowledgeBase: 'knowledge-base/articles',
  LogType: 'log-types',
  //AvatarAsset: 'avatar-assets',
  LearningPath: 'learning-paths',
  PersonaQuestion: 'persona-questions',
} as const satisfies Record<ContentType, string>;

// Time Constants
export const TIME_CONSTANTS = {
  SECONDS_PER_MINUTE: 60,
  MINUTES_PER_HOUR: 60,
  HOURS_PER_DAY: 24,
  DAYS_PER_WEEK: 7,
  DAYS_PER_MONTH: 30,
  DAYS_PER_YEAR: 365
} as const;
