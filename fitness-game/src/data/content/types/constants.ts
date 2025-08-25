// Content Management Constants and Enums

// Content Categories (based on requirements.md R1.2)
export const CONTENT_CATEGORIES = {
  EQUIPMENT: 'equipment',
  FORM: 'form',
  NUTRITION: 'nutrition',
  INJURY_PREVENTION: 'injury_prevention',
  BODY_MECHANICS: 'body_mechanics',
  FOUNDATIONAL_MOVEMENTS: 'foundational_movements',
  EXERCISE_IDENTIFICATION: 'exercise_identification'
} as const;

export type ContentCategoryId = typeof CONTENT_CATEGORIES[keyof typeof CONTENT_CATEGORIES];

// Content Category Names (for display)
export const CONTENT_CATEGORY_NAMES: Record<ContentCategoryId, string> = {
  [CONTENT_CATEGORIES.EQUIPMENT]: 'Equipment Identification',
  [CONTENT_CATEGORIES.FORM]: 'Form Check',
  [CONTENT_CATEGORIES.NUTRITION]: 'Nutrition Myths vs Facts',
  [CONTENT_CATEGORIES.INJURY_PREVENTION]: 'Injury Prevention',
  [CONTENT_CATEGORIES.BODY_MECHANICS]: 'Body Mechanics',
  [CONTENT_CATEGORIES.FOUNDATIONAL_MOVEMENTS]: 'Foundational Movements',
  [CONTENT_CATEGORIES.EXERCISE_IDENTIFICATION]: 'Exercise Identification'
};

// Content Category Descriptions
export const CONTENT_CATEGORY_DESCRIPTIONS: Record<ContentCategoryId, string> = {
  [CONTENT_CATEGORIES.EQUIPMENT]: 'Learn to identify and use fitness equipment properly',
  [CONTENT_CATEGORIES.FORM]: 'Master proper exercise form and technique',
  [CONTENT_CATEGORIES.NUTRITION]: 'Separate fitness nutrition facts from myths',
  [CONTENT_CATEGORIES.INJURY_PREVENTION]: 'Understand how to prevent workout injuries',
  [CONTENT_CATEGORIES.BODY_MECHANICS]: 'Learn proper body mechanics for safe movement',
  [CONTENT_CATEGORIES.FOUNDATIONAL_MOVEMENTS]: 'Master fundamental movement patterns',
  [CONTENT_CATEGORIES.EXERCISE_IDENTIFICATION]: 'Identify and understand different exercises'
};

// Content Category Icons
export const CONTENT_CATEGORY_ICONS: Record<ContentCategoryId, string> = {
  [CONTENT_CATEGORIES.EQUIPMENT]: 'dumbbell',
  [CONTENT_CATEGORIES.FORM]: 'target',
  [CONTENT_CATEGORIES.NUTRITION]: 'apple',
  [CONTENT_CATEGORIES.INJURY_PREVENTION]: 'shield',
  [CONTENT_CATEGORIES.BODY_MECHANICS]: 'activity',
  [CONTENT_CATEGORIES.FOUNDATIONAL_MOVEMENTS]: 'zap',
  [CONTENT_CATEGORIES.EXERCISE_IDENTIFICATION]: 'list'
};

// Difficulty Levels
export const DIFFICULTY_LEVELS = {
  EASY: 1,
  MEDIUM_EASY: 2,
  MEDIUM: 3,
  MEDIUM_HARD: 4,
  HARD: 5
} as const;

export type DifficultyLevel = typeof DIFFICULTY_LEVELS[keyof typeof DIFFICULTY_LEVELS];

// Difficulty Level Names
export const DIFFICULTY_LEVEL_NAMES: Record<DifficultyLevel, string> = {
  [DIFFICULTY_LEVELS.EASY]: 'Easy',
  [DIFFICULTY_LEVELS.MEDIUM_EASY]: 'Medium-Easy',
  [DIFFICULTY_LEVELS.MEDIUM]: 'Medium',
  [DIFFICULTY_LEVELS.MEDIUM_HARD]: 'Medium-Hard',
  [DIFFICULTY_LEVELS.HARD]: 'Hard'
};

// Question Types
export const QUESTION_TYPES = {
  MULTIPLE_CHOICE: 'multiple_choice',
  PASSAGE_BASED: 'passage_based',
  TRUE_FALSE: 'true_false'
} as const;

export type QuestionType = typeof QUESTION_TYPES[keyof typeof QUESTION_TYPES];

// Streak Types (based on entities.md)
export const STREAK_TYPES = {
  WORKOUT_COMPLETED: 'workout_completed',
  ATE_CLEAN: 'ate_clean',
  SLEPT_WELL: 'slept_well',
  HYDRATED: 'hydrated',
  QUIZ_COMPLETED: 'quiz_completed',
  QUIZ_PASSED: 'quiz_passed',
  ALL: 'all'
} as const;

export type StreakTypeId = typeof STREAK_TYPES[keyof typeof STREAK_TYPES];

// Streak Type Names
export const STREAK_TYPE_NAMES: Record<StreakTypeId, string> = {
  [STREAK_TYPES.WORKOUT_COMPLETED]: 'Daily Workout',
  [STREAK_TYPES.ATE_CLEAN]: 'Clean Eating',
  [STREAK_TYPES.SLEPT_WELL]: 'Quality Sleep',
  [STREAK_TYPES.HYDRATED]: 'Hydration Goal',
  [STREAK_TYPES.QUIZ_COMPLETED]: 'Daily Quiz Completed',
  [STREAK_TYPES.QUIZ_PASSED]: 'Daily Quiz Passed',
  [STREAK_TYPES.ALL]: 'Perfect Day'
};

// User States (based on requirements.md R1.2)
export const USER_STATES = {
  AVERAGE: 'average',
  FIT_HEALTHY: 'fit-healthy',
  LEAN_TIRED: 'lean-tired',
  INJURED_RECOVERING: 'injured-recovering',
  FIT_INJURED: 'fit-injured'
} as const;

export type UserStateId = typeof USER_STATES[keyof typeof USER_STATES];

// Avatar Genders
export const AVATAR_GENDERS = {
  MALE: 'male',
  FEMALE: 'female'
} as const;

export type AvatarGender = typeof AVATAR_GENDERS[keyof typeof AVATAR_GENDERS];

// Avatar Age Ranges
export const AVATAR_AGE_RANGES = {
  CHILD: 'child', // 5-12
  TEEN: 'teen', // 13-19
  YOUNG_ADULT: 'young-adult', // 20-39
  MIDDLE_AGE: 'middle-age', // 40-59
  SENIOR: 'senior' // 60+
} as const;

export type AvatarAgeRange = typeof AVATAR_AGE_RANGES[keyof typeof AVATAR_AGE_RANGES];

// Achievement Categories
export const ACHIEVEMENT_CATEGORIES = {
  STREAKS: 'streaks',
  KNOWLEDGE: 'knowledge',
  SOCIAL: 'social',
  HABITS: 'habits'
} as const;

export type AchievementCategory = typeof ACHIEVEMENT_CATEGORIES[keyof typeof ACHIEVEMENT_CATEGORIES];

// Achievement Tiers
export const ACHIEVEMENT_TIERS = {
  BRONZE: 'bronze',
  SILVER: 'silver',
  GOLD: 'gold',
  PLATINUM: 'platinum',
  DIAMOND: 'diamond'
} as const;

export type AchievementTier = typeof ACHIEVEMENT_TIERS[keyof typeof ACHIEVEMENT_TIERS];

// Content File Extensions
export const CONTENT_FILE_EXTENSIONS = {
  JSON: '.json',
  MARKDOWN: '.md',
  YAML: '.yml'
} as const;

// Content Directory Names
export const CONTENT_DIRECTORIES = {
  CATEGORIES: 'categories',
  QUESTIONS: 'questions',
  PASSAGES: 'passages',
  KNOWLEDGE_BASE: 'knowledge-base',
  DAILY_CHALLENGES: 'daily-challenges',
  ACHIEVEMENTS: 'achievements',
  USER_STATES: 'user-states',
  STREAK_TYPES: 'streak-types',
  AVATAR_ASSETS: 'avatar-assets'
} as const;

// Content Validation Rules
export const CONTENT_VALIDATION_RULES = {
  MAX_QUESTIONS_PER_CATEGORY: 100,
  MAX_PASSAGES_PER_CATEGORY: 50,
  MAX_KNOWLEDGE_BASE_PER_CATEGORY: 25,
  MIN_QUESTIONS_PER_DAILY_CHALLENGE: 10,
  MAX_QUESTIONS_PER_DAILY_CHALLENGE: 10,
  MIN_DIFFICULTY_LEVEL: 1,
  MAX_DIFFICULTY_LEVEL: 5,
  MAX_OPTIONS_PER_QUESTION: 4,
  MIN_OPTIONS_PER_QUESTION: 2,
  MAX_HINTS_PER_QUESTION: 3,
  MIN_HINTS_PER_QUESTION: 1
} as const;

// Content Generation Constants
export const CONTENT_GENERATION = {
  DEFAULT_QUESTIONS_PER_CATEGORY: 50,
  DEFAULT_PASSAGES_PER_CATEGORY: 20,
  DEFAULT_KNOWLEDGE_BASE_PER_CATEGORY: 10,
  DEFAULT_DAILY_CHALLENGES: 30,
  DEFAULT_ACHIEVEMENTS: 25,
  DEFAULT_USER_STATES: 5,
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
  PASSAGE_READ_TIME_MULTIPLIER: 0.5, // minutes per word
  MIN_QUESTIONS_FOR_ACHIEVEMENT: 50,
  MIN_STREAK_DAYS_FOR_ACHIEVEMENT: 7
} as const;
