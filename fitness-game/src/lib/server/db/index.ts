import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const intializeDb = () => {
    // Database connection configuration
    const connectionString = process.env.DATABASE_URL!;

    // Create postgres client
    // Disable prefetch as it is not supported for "Transaction" pool mode
    const client = postgres(connectionString, { prepare: false });

    // Create drizzle instance
    return drizzle(client, { schema, logger: true });
}
let db: ReturnType<typeof intializeDb>;

export const getDBInstance = () => {
  if (!db) {
    db = intializeDb();
  }
  return db;
}
