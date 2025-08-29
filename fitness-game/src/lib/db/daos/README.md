# Database DAOs (Data Access Objects)

This directory contains the Data Access Object classes for the FitJourney game database. Each DAO is responsible for handling all database operations for a specific data model.

## Architecture

The DAO pattern provides a clean separation between business logic and data access logic. Each DAO class encapsulates all database operations for its respective model, making the code more maintainable and testable.

## DAO Classes

### UserDAO
**File**: `user-dao.ts`
**Purpose**: Handles all user and user profile related database operations

**Key Methods**:
- `getUserWithProfile(userId)` - Get user with profile data
- `getUserById(userId)` - Get user by ID
- `getUserByEmail(email)` - Get user by email
- `createUser(userData)` - Create new user
- `updateUser(userId, updates)` - Update user data
- `getUserProfile(userId)` - Get user profile
- `upsertUserProfile(userId, profileData)` - Create or update profile
- `updateCurrentFitnessLevel(userId, level)` - Update fitness level
- `updateCurrentStreakIds(userId, streakIds)` - Update current streaks
- `updateLongestStreaks(userId, longestStreaks)` - Update longest streaks

### GameSessionDAO
**File**: `game-session-dao.ts`
**Purpose**: Handles all game session related database operations

**Key Methods**:
- `getCurrentSession(userId)` - Get user's current active session
- `getSessionById(sessionId)` - Get session by ID
- `getSessionsByDateRange(userId, startDate, endDate)` - Get sessions in date range
- `createSession(sessionData)` - Create new game session
- `completeSession(sessionId, completionData)` - Complete a session
- `incrementAttemptCount(sessionId)` - Increment retry attempts
- `updateInProgressStatus(sessionId, status)` - Update session status
- `hasUserCompletedChallengeForDate(userId, challengeId, date)` - Check completion

### StreakDAO
**File**: `streak-dao.ts`
**Purpose**: Handles all streak and habit tracking related database operations

**Key Methods**:
- `getCurrentStreaks(userId)` - Get user's current active streaks
- `getStreakHistoryByType(userId, streakType)` - Get streaks by type
- `getStreakLogForDate(userId, date)` - Get daily habit log
- `logDailyHabits(userId, date, entries)` - Log daily habits
- `upsertStreakHistory(streakData)` - Create or update streak
- `endStreak(streakId, endDate)` - End a current streak
- `getUserStreakStats(userId)` - Get comprehensive streak statistics
- `calculateCurrentStreak(userId, streakType)` - Calculate current streak length

**Streak Types Supported**:
- `workout_completed` - Daily workout completion
- `ate_clean` - Clean eating habits
- `slept_well` - Quality sleep
- `hydrated` - Hydration goals
- `quiz_completed` - Daily quiz completion
- `quiz_passed` - Daily quiz passing
- `all` - Perfect day (all habits completed)

### FitnessLevelDAO
**File**: `fitness-level-dao.ts`
**Purpose**: Handles all fitness level related database operations

**Key Methods**:
- `getCurrentFitnessLevel(userId)` - Get current fitness level
- `getFitnessLevelHistory(userId, limit)` - Get fitness level history
- `addFitnessLevelEntry(userId, level, calculatedAt)` - Add new entry
- `updateFitnessLevel(userId, newLevel)` - Update level (history + profile)
- `getFitnessLevelTrend(userId, days)` - Get trend over time period
- `getHighestFitnessLevel(userId)` - Get highest level achieved
- `getLowestFitnessLevel(userId)` - Get lowest level achieved
- `getFitnessLevelMilestones(userId)` - Get level achievement milestones
- `calculateFitnessLevelChange(userId, startDate, endDate)` - Calculate change

## Usage Examples

### Basic Usage
```typescript
import { UserDAO, GameSessionDAO, StreakDAO, FitnessLevelDAO } from '@/lib/db/daos';

// Initialize DAOs
const userDAO = new UserDAO();
const gameSessionDAO = new GameSessionDAO();
const streakDAO = new StreakDAO();
const fitnessLevelDAO = new FitnessLevelDAO();

// Get user with profile
const userWithProfile = await userDAO.getUserWithProfile(userId);

// Create new game session
const session = await gameSessionDAO.createSession({
  user_id: userId,
  challenge_id: 'day-1',
  session_timezone: 'UTC-7',
  session_date_utc: new Date(),
});

// Log daily habits
await streakDAO.logDailyHabits(userId, new Date(), {
  workout_completed: true,
  ate_clean: false,
  slept_well: true,
  hydrated: true,
  quiz_completed: true,
  quiz_passed: true,
  all: false,
});

// Update fitness level
await fitnessLevelDAO.updateFitnessLevel(userId, 2);
```

### Advanced Usage
```typescript
// Get user's streak statistics
const streakStats = await streakDAO.getUserStreakStats(userId);
console.log(`Current workout streak: ${streakStats.workout_completed}`);

// Get fitness level progression
const progression = await fitnessLevelDAO.getFitnessLevelProgression(
  userId, 
  new Date('2024-01-01'), 
  new Date('2024-01-31')
);

// Check if user completed today's challenge
const completedToday = await gameSessionDAO.hasUserCompletedChallengeForDate(
  userId, 
  'day-1', 
  new Date()
);
```

## Benefits of DAO Pattern

### 1. **Separation of Concerns**
- Business logic is separate from data access logic
- Each DAO focuses on a single responsibility

### 2. **Maintainability**
- Database operations are centralized and easy to modify
- Changes to database schema only affect the relevant DAO

### 3. **Testability**
- DAOs can be easily mocked for unit testing
- Business logic can be tested independently

### 4. **Reusability**
- DAO methods can be reused across different parts of the application
- Consistent data access patterns

### 5. **Type Safety**
- Full TypeScript support with proper return types
- Compile-time error checking for database operations

## Error Handling

All DAO methods include proper error handling:
- Database connection errors are propagated up
- Invalid data operations throw descriptive errors
- Null checks are performed where appropriate

## Performance Considerations

- DAOs use efficient database queries with proper indexing
- Date range queries are optimized for performance
- Large result sets are limited with pagination parameters
- Complex operations are broken down into efficient queries

## Future Enhancements

- **Caching Layer**: Add Redis caching for frequently accessed data
- **Connection Pooling**: Implement connection pooling for high-traffic scenarios
- **Query Optimization**: Add query performance monitoring and optimization
- **Batch Operations**: Implement batch operations for bulk data processing
- **Audit Logging**: Add comprehensive audit logging for data changes

## Dependencies

- **Drizzle ORM**: For type-safe database operations
- **PostgreSQL**: Database backend
- **TypeScript**: For type safety and better developer experience

The DAO structure provides a solid foundation for the FitJourney game's data access layer, ensuring clean, maintainable, and performant database operations.
