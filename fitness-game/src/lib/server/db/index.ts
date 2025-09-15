import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

// Database connection configuration
const connectionString = process.env.DATABASE_URL!;

// Create postgres client
// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString, { prepare: false });

// Create drizzle instance
export const db = drizzle(client, { schema, logger: true });
