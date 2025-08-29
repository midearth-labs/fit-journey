// Export all DAO classes
export { UserDAO } from './user-dao';
export { GameSessionDAO } from './game-session-dao';
export { StreakDAO } from './streak-dao';
export { FitnessLevelDAO } from './fitness-level-dao';

// Re-export types for convenience
export type {
  User,
  NewUser,
  UserProfile,
  NewUserProfile,
  GameSession,
  NewGameSession,
  StreakLog,
  NewStreakLog,
  StreakHistory,
  NewStreakHistory,
  FitnessLevelHistory,
  NewFitnessLevelHistory,
} from '../schema';
