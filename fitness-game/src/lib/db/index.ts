import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Database connection configuration
const connectionString = process.env.DATABASE_URL!;

// Create postgres client
// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString, { prepare: false });

// Create drizzle instance
export const db = drizzle(client, { schema });

// Export schema for use in other parts of the application
export * from './schema';

// Export DAOs
export * from './daos';

// Export types for convenience
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
} from './schema';
