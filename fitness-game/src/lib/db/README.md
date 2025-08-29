# FitJourney Game Database Schema

This directory contains the database schema and setup files for the FitJourney game application.

## Overview

The database uses PostgreSQL with Supabase and is managed through Drizzle ORM. The schema includes all necessary tables for user management, game sessions, streak tracking, and fitness level progression.

## Database Tables

### Core Tables

#### `users`
- **Purpose**: Stores user information synced from Supabase Auth
- **Key Fields**: 
  - `id`: UUID primary key (matches Supabase Auth user ID)
  - `email`: User's email address (unique)
  - `display_name`: User's display name
  - `avatar_gender`: Avatar gender preference (male/female)
  - `avatar_age_range`: Avatar age range preference
  - `timezone`: User's timezone
  - `preferred_reminder_time`: Preferred daily reminder time
  - `notification_preferences`: JSON object for notification settings

#### `user_profiles`
- **Purpose**: Stores user profile data and current state
- **Key Fields**:
  - `user_id`: Foreign key to users table
  - `current_fitness_level`: Current fitness level (-5 to +5)
  - `current_streak_ids`: JSON object mapping streak types to streak history IDs
  - `longest_streaks`: JSON object mapping streak types to longest streak IDs
  - `last_activity_date`: Last recorded activity date
  - `latest_game_session`: Reference to most recent game session

#### `game_sessions`
- **Purpose**: Tracks individual game sessions for daily challenges
- **Key Fields**:
  - `user_id`: Foreign key to users table
  - `challenge_id`: Reference to daily challenge (stored as JSON file)
  - `session_timezone`: Timezone when session started (for security)
  - `session_date_utc`: UTC date when session was first started
  - `user_answers`: JSON array of user's answers and performance
  - `attempt_count`: Number of attempts (max 3 per day)
  - `in_progress`: Whether session is currently active

#### `streak_logs`
- **Purpose**: Daily habit logging for streak tracking
- **Key Fields**:
  - `user_id`: Foreign key to users table
  - `date_utc`: UTC date for the log entry
  - `entries`: JSON object with boolean values for each habit type

#### `streak_histories`
- **Purpose**: Tracks streak history and milestones
- **Key Fields**:
  - `user_id`: Foreign key to users table
  - `streak_length`: Length of the streak
  - `started_date`: When the streak began
  - `ended_date`: When the streak ended (null if current)
  - `streak_type`: Type of streak (workout_completed, ate_clean, etc.)

#### `fitness_level_histories`
- **Purpose**: Tracks fitness level changes over time
- **Key Fields**:
  - `user_id`: Foreign key to users table
  - `fitness_level`: Fitness level value (-5 to +5)
  - `calculated_at`: When the level was calculated

## Data Types

### Enums
- `avatar_gender`: `['male', 'female']`
- `avatar_age_range`: `['child', 'teen', 'young-adult', 'middle-age', 'senior']`
- `question_type`: `['standalone', 'passage_based']`

### JSONB Fields
All JSONB fields use the `$type` feature for static typing:
- `notification_preferences`: User notification settings
- `current_streak_ids`: Current streak references
- `longest_streaks`: Longest streak references
- `user_answers`: Game session answers and performance
- `entries`: Daily habit log entries

## Security Features

### Row Level Security (RLS)
- All tables have RLS enabled
- Users can only access their own data
- Policies use `auth.uid()` for user identification

### Foreign Key Constraints
- Cascade deletes for user-related data
- Proper referential integrity maintained

### Indexes
- Performance indexes on frequently queried fields
- Composite indexes for complex queries

## Setup Instructions

### 1. Environment Variables
Ensure you have the following environment variables set:
```bash
DATABASE_URL=postgresql://username:password@host:port/database
```

### 2. Database Migration
```bash
# Generate migration files
npm run db:generate

# Apply migrations
npm run db:migrate
```

### 3. Manual Setup (Alternative)
If you prefer to set up the database manually:
```bash
# Run the complete setup script
psql -h your-host -U your-user -d your-database -f src/lib/db/setup.sql
```

### 4. Verify Setup
```bash
# Open Drizzle Studio to verify tables
npm run db:studio
```

## Usage Examples

### Basic Database Operations
```typescript
import { db } from '@/lib/db';
import { users, userProfiles } from '@/lib/db/schema';

// Get user with profile
const userWithProfile = await db.query.users.findFirst({
  where: (users, { eq }) => eq(users.id, userId),
  with: {
    profile: true,
  },
});

// Create new game session
const newSession = await db.insert(gameSessions).values({
  user_id: userId,
  challenge_id: 'day-1',
  session_timezone: 'UTC-7',
  session_date_utc: new Date(),
});
```

### Type Safety
All database operations are fully typed:
```typescript
import type { User, GameSession } from '@/lib/db/schema';

// These types are automatically inferred from the schema
const user: User = await db.query.users.findFirst();
const session: GameSession = await db.query.gameSessions.findFirst();
```

## Maintenance

### Adding New Tables
1. Add table definition to `schema.ts`
2. Generate migration: `npm run db:generate`
3. Apply migration: `npm run db:migrate`
4. Update RLS policies if needed

### Schema Changes
1. Modify existing table definitions in `schema.ts`
2. Generate and review migration files
3. Test migrations in development environment
4. Apply to production with proper backup

## Troubleshooting

### Common Issues

#### Migration Failures
- Check database connection string
- Ensure database user has proper permissions
- Verify PostgreSQL version compatibility

#### RLS Policy Issues
- Check if user is authenticated
- Verify `auth.uid()` function availability
- Ensure policies are properly created

#### Type Errors
- Run `npm run type-check` to verify types
- Check import paths in schema files
- Ensure Drizzle ORM version compatibility

### Performance Optimization
- Monitor query performance with Drizzle Studio
- Add indexes for slow queries
- Use proper foreign key relationships
- Consider read replicas for high-traffic scenarios

## References

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
