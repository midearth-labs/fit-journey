# Challenge System Low-Level Design Document

## Executive Summary

This document provides a detailed low-level design for the **FitJourney Challenge System**. This feature is the primary engagement and retention engine for the FitJourney blog. It transforms passive content consumption into an interactive, goal-oriented experience by allowing authenticated users to enroll in time-bound challenges. These challenges involve reading articles, completing quizzes, and building consistent habits, all with a high degree of user flexibility. This LLD covers the data models, API specifications, core business logic, and backend processes required to implement this system.

## Design Context

### Requirements Reference
**Functional Requirements**:
- Users can browse and select from a list of predefined challenges (e.g., "30-day FitJourney").
- Users must be authenticated to join a challenge.
- Users must select a start date between today and two weeks in the future.
- Users can reschedule their start date, but the new date must be within one month of the *original* chosen date.
- Article consumption is flexible: users can read in any order and at any pace.
- Habit logging is flexible: users can log habits for the current day or any prior day back to their challenge start date.
- After the challenge duration ends, a 48-hour grace period begins for completing quizzes and logs.
- After the grace period, the challenge becomes locked and read-only.

**Non-Functional Requirements**:
- **Security**: A user's challenge data must be accessible only by that user.
- **Reliability**: The background process for updating challenge statuses must be robust and idempotent.
- **Performance**: API responses for fetching a user's challenge state should be fast (<200ms) to ensure a smooth user experience.

**User Journey Reference**:
This design covers the core journey from a user discovering a challenge CTA, enrolling, participating with flexible scheduling and logging, completing the challenge, and finally viewing their locked, archived results.

**Dependencies**:
- **Authentication Service**: Provides the identity (`userId`) of the authenticated user.
- **Content Management System**: An internal application module responsible for loading and serving the static JSON definitions of challenges, articles, and quizzes from the code repository.
- **Notification Service**: (External to this LLD) A service that can be called to send notifications to users (e.g., "Your challenge is complete, you have 48 hours to finalize your entries").

### Scope & Boundaries
**In Scope**:
- Database schema for all dynamic, user-specific challenge data.
- API endpoints for creating, managing, and interacting with a user's challenge.
- The business logic for validation (e.g., date ranges, status transitions).
- The design of the scheduled background process for managing challenge lifecycles.

**Out of Scope**:
- The design of the Authentication Service itself.
- UI/UX implementation for the blog or challenge dashboard.
- The content of knowledge base articles and questions.
- The implementation of the Notification Service.

**Assumptions**:
- An Authentication Service is in place and provides a verifiable `userId` for all authenticated requests.
- Static content (challenges, articles, quizzes) is managed in version-controlled JSON files and can be reliably accessed by the application at runtime.
- A scheduler (e.g., cron) is available to trigger the backend status update process.

## Detailed Component Design

### Component Architecture
The system is composed of several logical components within the application backend.

```mermaid
graph TD
    subgraph User Request Flow
        A[API Gateway / Router] --> B{Challenge Controller};
    end

    subgraph Application Core
        B --> C[Challenge Service];
        C --> D[User Challenge Repository];
        C --> E[Content Management System];
        D --> F[(PostgreSQL Database)];
        E --> G[/static/challenges.json];
        G --> E;
    end
    
    subgraph Scheduled Processes
        H[Scheduler (Cron)] --> I{Status Update Job};
        I --> C;
    end
```

#### Component Responsibilities
**Challenge Controller**
- **Primary Responsibility**: To handle incoming HTTP requests, validate request payloads using Zod, and route them to the appropriate `ChallengeService` method.
- **Dependencies**: `ChallengeService`.
- **Dependents**: API Gateway/Router.

**Challenge Service**
- **Primary Responsibility**: To orchestrate all business logic related to challenges. This includes creating challenges, validating date changes, processing quiz submissions, and managing habit logs.
- **Secondary Responsibilities**: Encapsulating all business rules (e.g., status transition logic, date window validation).
- **Dependencies**: `UserChallengeRepository`, `ContentManagementSystem`.
- **Dependents**: `ChallengeController`, `StatusUpdateJob`.

**User Challenge Repository**
- **Primary Responsibility**: To handle all data access operations (CRUD) for user-specific challenge entities using the Drizzle ORM.
- **Secondary Responsibilities**: Constructing complex queries, managing database transactions.
- **Dependencies**: Drizzle Client, Database Connection.
- **Dependents**: `ChallengeService`.

**Content Management System**
- **Primary Responsibility**: To provide a simple, in-memory interface for accessing the static challenge definitions, articles, and habits loaded from JSON files.
- **Dependencies**: Filesystem/Module Loader.
- **Dependents**: `ChallengeService`.

## Interface Specifications

#### Public APIs

**CreateUserChallenge**: `POST /user-challenges`
```typescript
// Zod Request Schema
const CreateUserChallengeRequest = z.object({
  challengeId: z.number().int().positive(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
});

// Zod Response Schema (201 Created)
const UserChallengeResponse = z.object({
  id: z.number().int(),
  challengeId: z.number().int(),
  userId: z.number().int(),
  startDate: z.string(), // YYYY-MM-DD
  originalStartDate: z.string(), // YYYY-MM-DD
  status: z.enum(['not_started', 'active', 'completed', 'locked']),
  createdAt: z.string().datetime(),
});
```
- **Purpose**: Enrolls an authenticated user in a new challenge.
- **Preconditions**: User must be authenticated. The chosen `startDate` must not be more than 2 weeks from the current date. The `challengeId` must be valid. User must not have another active challenge.
- **Postconditions**: A new `user_challenges` record is created in the database. `originalStartDate` is set and becomes immutable.
- **Error Conditions**: `400` (Invalid Date/Payload), `401` (Unauthorized), `409` (User already has an active challenge).

**GetUserChallenge**: `GET /user-challenges/:userChallengeId`
- **Purpose**: Retrieves the full state of a user's challenge, including their progress.
- **Preconditions**: User must be authenticated and must be the owner of the requested `userChallengeId`.
- **Postconditions**: A complete view-model of the user's challenge is returned.
- **Error Conditions**: `401` (Unauthorized), `403` (Forbidden), `404` (Not Found).

**UpdateUserChallengeSchedule**: `PATCH /user-challenges/:userChallengeId/schedule`
```typescript
// Zod Request Schema
const UpdateUserChallengeScheduleRequest = z.object({
  newStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
```
- **Purpose**: Reschedules the start date of a challenge.
- **Preconditions**: User must be authenticated and the owner. The challenge `status` must be `not_started`. The `newStartDate` must be within one month of the `originalStartDate`.
- **Postconditions**: The `startDate` field in the `user_challenges` record is updated.
- **Error Conditions**: `400` (Date out of bounds), `403` (Forbidden), `409` (Challenge already started).

**SubmitUserChallengeQuiz**: `POST /user-challenges/:userChallengeId/progress/:knowledgeBaseId/quiz`
- **Purpose**: Submits user answers for a quiz associated with an article.
- **Preconditions**: User must be the owner. The challenge must not be `locked`. The `knowledgeBaseId` must be part of the user's challenge.
- **Postconditions**: A `user_challenge_progress` record is created or updated with the quiz score and answers.
- **Error Conditions**: `403` (Forbidden), `404` (Article not part of challenge), `409` (Challenge locked or quiz already submitted).

**PutUserChallengeLog**: `PUT /user-challenges/:userChallengeId/logs/:logDate`
- **Purpose**: Creates or replaces the entire habit log for a single day.
- **Preconditions**: User must be the owner. The challenge must not be `locked`. The `logDate` must be on or after the challenge `startDate` and not in the future.
- **Postconditions**: The `user_habit_logs` table has an entry for the user/challenge/date with the provided values. This operation is an UPSERT.
- **Error Conditions**: `400` (Invalid Date), `403` (Forbidden), `409` (Challenge locked).

**ListUserChallengeLogs**: `GET /user-challenges/:userChallengeId/logs?from=YYYY-MM-DD&to=YYYY-MM-DD`
- **Purpose**: Retrieves a user's habit logs for a specific date range.
- **Preconditions**: User must be the owner.
- **Postconditions**: An array of daily log objects is returned.
- **Error Conditions**: `400` (Invalid date range), `403` (Forbidden).

## Data Design

### Data Models
**user_challenges**
```typescript
// Drizzle Schema
/**
 * Defines the lifecycle status of a user's participation in a challenge.
 * (Unchanged from previous design)
 */
export const userChallengeStatusEnum = pgEnum('user_challenge_status', [
  'not_started',
  'active',
  'completed',
  'locked',
]);

/**
 * Describes the structure for a single answer submitted by a user for a quiz.
 * An array of these will be stored in the `quizAnswers` JSONB field.
 */
export type UserAnswer = {
  questionId: number;
  selectedAnswer: number; // Flexible for different question types
};

/**
 * Describes the structure for the daily habit log.
 * The key is the `challengeHabitId` (as a string, since JSON keys are strings),
 * and the value is the data logged by the user.
 */
export type DailyHabitLogPayload = {
    workout_completed?: boolean,
    ate_clean?: boolean,
    slept_well?: boolean,
    hydrated?: boolean,
};

/**
 * USER CHALLENGES
 * Represents a specific user's instance of a challenge.
 * This table is central to tracking a user's journey.
 */
export const userChallenges = pgTable('user_challenges', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // NOTE: 'challengeId' is just a string. Your application must validate
  // that this ID exists in your static JSON challenge definitions.
  challengeId: text('challenge_id').notNull(),

  startDate: date('start_date').notNull(),
  originalStartDate: date('original_start_date').notNull(),
  status: userChallengeStatusEnum('status').notNull().default('not_started'),
  
  completedAt: timestamp('completed_at'), // Marks the start of the grace period
  lockedAt: timestamp('locked_at'), // Marks when the challenge becomes read-only
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```
- **Business Rules**: `originalStartDate` is immutable after creation. `status` transitions must follow the prescribed lifecycle (`not_started` -> `active` -> `completed` -> `locked`).
- **Relationships**: Many-to-one with `users`.
- **Indexing Strategy**: Index on `(userId)`. Index on `(status)` for the background job.

**user_challenge_progress**
```typescript
/**
 * USER CHALLENGE PROGRESS
 * Tracks a user's progress on a specific article/quiz within their challenge.
 */
// Drizzle Schema
export const userChallengeProgress = pgTable('user_challenge_progress', {
    id: uuid('id').primaryKey().defaultRandom(),
    userChallengeId: uuid('user_challenge_id').notNull().references(() => userChallenges.id, { onDelete: 'cascade' }),
    
    // NOTE: 'knowledgeBaseId' corresponds to an ID in your static JSON.
    knowledgeBaseId: text('knowledge_base_id').notNull(),

    quizScore: integer('quiz_score'), // e.g., percentage 0-100
    quizCompletedAt: timestamp('quiz_completed_at'),
    
    /**
     * NEW: Stores all user answers for this quiz in a single JSONB field.
     * This is ideal for batch submissions.
     */
    quizAnswers: jsonb('quiz_answers').$type<UserAnswer[]>(),

    firstViewedAt: timestamp('first_viewed_at'),
    lastViewedAt: timestamp('last_viewed_at'),
  }, (table) => {
    return {
      // A user should only have one progress record per article in their challenge.
      unq: uniqueIndex('user_challenge_article_unique').on(table.userChallengeId, table.knowledgeBaseId),
    };
});
```
- **Business Rules**: `userChallengeId` and `knowledgeBaseId` combination must be unique.
- **Relationships**: Many-to-one with `user_challenges`.
- **Indexing Strategy**: Unique index on `(userChallengeId, knowledgeBaseId)`.

**user_habit_logs**
```typescript
// Drizzle Schema

/**
 * USER HABIT LOGS (Redesigned)
 * This table now stores one row per user, per challenge, per day.
 * All habit data for that day is consolidated into a single JSONB object.
 */
export const userHabitLogs = pgTable('user_habit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userChallengeId: uuid('user_challenge_id').notNull().references(() => userChallenges.id, { onDelete: 'cascade' }),
  
  // The specific date this log entry is for. CRITICAL for back-logging.
  logDate: date('log_date').notNull(),
  
  /**
   * NEW: A JSONB object holding all habit values for the given day.
   * Example: { "habit_id_1": true, "habit_id_5": 120, "habit_id_7": "Ate a healthy salad" }
   */
  values: jsonb('values').notNull().$type<DailyHabitLogPayload>(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    // Ensures a user can only have ONE log entry per day for a given challenge.
    // This makes updates (UPSERTs) simple and prevents duplicate data.
    unq: uniqueIndex('user_daily_log_unique').on(table.userChallengeId, table.logDate),
  };
});
```
- **Business Rules**: `userChallengeId` and `logDate` combination must be unique.
- **Relationships**: Many-to-one with `user_challenges`.
- **Indexing Strategy**: Unique index on `(userChallengeId, logDate)`.

### Data Access Patterns
**Habit Log UPSERT**
- **Query Pattern**: When a user submits a daily log via `PUT .../logs/:logDate`, the repository will use an `INSERT ... ON CONFLICT (userChallengeId, logDate) DO UPDATE` statement to either create a new row or update an existing one atomically.
- **Transaction Boundaries**: This is a single atomic operation.

**Challenge Creation**
- **Query Pattern**: A user signs up for a challenge.
- **Transaction Boundaries**: The creation of the `user_challenges` record should be a single transaction.

**Challenge Dashboard View**
- **Query Pattern**: The `GetUserChallenge` operation will execute two main queries: one to get the `user_challenges` record and another to get all associated `user_challenge_progress` records. These are then combined in the service layer with static data.
- **Caching Strategy**: The static challenge data (`ContentManagementSystem`) should be cached in memory application-wide upon startup to avoid file I/O on every request. User-specific data should not be cached aggressively to avoid staleness.

## Algorithm Design

### Core Algorithms
**Challenge Status Update Algorithm (Scheduled Job)**
```
Input: Current system time/date.
Output: Database records updated to reflect new statuses.
Complexity: Time O(N + M + K) where N, M, K are the number of challenges in each state. Space O(1).

Pseudocode:
1.  // Transition from NOT_STARTED to ACTIVE
2.  SELECT all userChallenges WHERE status = 'not_started' AND startDate <= CURRENT_DATE
3.  FOR each challenge found:
4.      UPDATE its status to 'active'

5.  // Transition from ACTIVE to COMPLETED
6.  SELECT all userChallenges uc
       JOIN staticChallenges sc ON uc.challengeId = sc.id
       WHERE uc.status = 'active' AND (uc.startDate + sc.durationDays) < CURRENT_DATE
7.  FOR each challenge found:
8.      UPDATE its status to 'completed'
9.      SET completedAt = NOW()
10.     TRIGGER notification "Challenge Complete, Grace Period Started"

11. // Transition from COMPLETED to LOCKED
12. SELECT all userChallenges WHERE status = 'completed' AND completedAt <= (NOW() - 48 hours)
13. FOR each challenge found:
14.     UPDATE its status to 'locked'
15.     SET lockedAt = NOW()
```
- **Edge Cases**: Job runs but there are no challenges to update. Job fails midway; transactions should be used for batches of updates to ensure partial success doesn't leave data in an inconsistent state. The job must be idempotent.

### Business Logic Flows
**Create User Challenge Flow**
```mermaid
flowchart TD
    A[User sends POST /user-challenges] --> B{Validate Payload (Zod)};
    B -->|Invalid| C[Return 400 Bad Request];
    B -->|Valid| D{Check for existing active challenge for user};
    D -->|Exists| E[Return 409 Conflict];
    D -->|None| F{Validate startDate is within 2 weeks};
    F -->|Invalid| C;
    F -->|Valid| G[Start DB Transaction];
    G --> H[Create user_challenges record];
    H --> I{Commit Transaction};
    I -->|Success| J[Return 201 Created with new object];
    I -->|Failure| K[Rollback & Return 500 Server Error];
```

## Implementation Specifications

### Key Implementation Details
**Scheduled Job**
- **Approach**: A cron job will be scheduled to run once every hour (or daily, depending on desired granularity). This job will execute the `Challenge Status Update Algorithm`.
- **Libraries/Frameworks**: `node-cron` for scheduling in a Node.js environment, or a platform-level scheduler like Kubernetes CronJob.

**Static Data Hydration**
- **Approach**: On application startup, a `ContentManagementSystem` singleton will read all `*.json` files defining challenges, articles, and habits from a designated directory, parse them, and store them in an in-memory map for fast lookups by ID. The system exists, it just needs to be extended for the new data-sets.

### Core Data Operations
**UPSERT Habit Log**
```typescript
// Drizzle ORM Example
import { db } from './db';
import { userHabitLogs } from './schema';
import { eq, and } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

async function upsertHabitLog(userChallengeId: number, logDate: string, values: DailyHabitLogPayload) {
  const excluded = alias(userHabitLogs, 'excluded');
  return db.insert(userHabitLogs)
    .values({ userChallengeId, logDate, values })
    .onConflictDoUpdate({
      target: [userHabitLogs.userChallengeId, userHabitLogs.logDate],
      set: {
        values: excluded.values,
        updatedAt: new Date(),
      },
    })
    .returning();
}
```

## Error Handling & Validation

### Error Scenarios
**403 Forbidden**
- **Trigger Conditions**: User A attempts to access or modify a resource owned by User B (e.g., `GET /user-challenges/challenge_of_user_B`).
- **Error Response**: `{"error": "Access denied"}`.
- **Recovery Strategy**: None. This is a terminal security error for the request.
- **Logging Requirements**: Log as a security warning, including `userId` and the target resource ID.

**409 Conflict**
- **Trigger Conditions**: A request violates a business rule based on the current state of a resource. Examples: trying to change the start date of an active challenge; trying to create a challenge when one is already active.
- **Error Response**: `{"error": "Operation cannot be completed in the resource's current state"}`.
- **Recovery Strategy**: The user must change their action (e.g., wait for the current challenge to finish).
- **Logging Requirements**: Log as an info-level event, as it's expected user behavior.

### Business Rule Validation
**Reschedule Window**
- **Rule Description**: A user can only change their `startDate` if the new date is within one calendar month of the `originalStartDate`.
- **Validation Logic**: `abs(newStartDate.getTime() - originalStartDate.getTime()) <= 31 * 24 * 60 * 60 * 1000`. This will be performed in the `ChallengeService`.
- **Error Message**: "The new start date must be within one month of your originally chosen date."
- **System Behavior**: The API will reject the request with a `400 Bad Request` status.

## Testing Specifications

### Integration Test Scenarios
**Challenge Lifecycle**
- **Components Involved**: `ChallengeController`, `ChallengeService`, `UserChallengeRepository`, and a test database. The `StatusUpdateJob` logic will be invoked manually.
- **Test Flow**:
    1.  Authenticate as a mock user.
    2.  Call `POST /user-challenges` to create a challenge starting tomorrow. Assert the response and DB state are correct (`status: 'not_started'`).
    3.  Manually advance system time by one day.
    4.  Trigger the status update logic.
    5.  Call `GET /user-challenges/:id` and assert the status is now `active`.
    6.  Repeat for transitions to `completed` and `locked`, asserting state at each step.
- **Mock Requirements**: Authentication middleware must be mocked to provide a `userId`. `NotificationService` must be mocked to verify it's called.
- **Assertion Points**: Database state (`status`, `completedAt`, `lockedAt` fields) and API responses at each stage.

### Edge Cases & Boundary Tests
**Habit Logging Date Boundaries**
- **Scenario**: A user attempts to log a habit for a date that is invalid.
- **Input Values**:
    - A date *before* the `startDate`.
    - A date in the future.
    - The exact `startDate`.
    - The exact end date of the challenge.
- **Expected Behavior**: Requests for dates before `startDate` or in the future should be rejected with a `400 Bad Request`. Requests for `startDate` and the end date should succeed.
- **Validation**: Verify API responses and check that no data is written to the database for invalid dates.