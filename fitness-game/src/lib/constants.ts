import type { GameType } from '@/types';

export const GAME_TYPES: Record<
  GameType,
  { name: string; description: string; emoji: string }
> = {
  equipment: {
    name: 'Equipment ID',
    description: 'Identify gym equipment and their uses',
    emoji: '🏋️',
  },
  form: {
    name: 'Form Check',
    description: 'Perfect your exercise form and technique',
    emoji: '💪',
  },
  nutrition: {
    name: 'Nutrition Myths',
    description: 'Bust common nutrition misconceptions',
    emoji: '🥗',
  },
  'injury-prevention': {
    name: 'Injury Prevention',
    description: 'Learn to exercise safely and prevent injuries',
    emoji: '🛡️',
  },
  anatomy: {
    name: 'Body Anatomy & Movements',
    description: 'Understand muscles and movement patterns',
    emoji: '🧠',
  },
} as const;

export const AVATAR_DEMOGRAPHICS = {
  'young-male': 'Young Male',
  'young-female': 'Young Female',
  'old-male': 'Older Male',
  'old-female': 'Older Female',
} as const;

export const AVATAR_STATES = {
  'muscular-strong': 'Muscular & Strong',
  'lean-fit': 'Lean & Fit',
  'unfit-weak': 'Unfit & Weak',
  injured: 'Injured',
  energetic: 'Energetic',
  tired: 'Tired',
} as const;

export const SCORING = {
  CORRECT_ANSWER: 10,
  WRONG_ANSWER: -2,
  TIME_BONUS_MAX: 5,
  PERFECT_GAME_BONUS: 50,
} as const;

export const DIFFICULTY_MULTIPLIERS = {
  1: 1.0,
  2: 1.2,
  3: 1.5,
  4: 1.8,
  5: 2.0,
} as const;

export const LOCAL_STORAGE_KEYS = {
  USER_PREFERENCES: 'fitness-game-preferences',
  OFFLINE_PROGRESS: 'fitness-game-offline-progress',
  GAME_HISTORY: 'fitness-game-history',
} as const;

export const API_ENDPOINTS = {
  QUESTIONS: '/api/questions',
  USER_PROFILE: '/api/user/profile',
  GAME_SESSION: '/api/game/session',
  LEADERBOARD: '/api/leaderboard',
  SHARE: '/api/share',
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
