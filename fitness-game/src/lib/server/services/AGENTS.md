# Service Layer Implementation Guide

This document outlines the patterns and conventions for implementing services in this fitness game application.

## Service Architecture Overview

Services are the business logic layer that orchestrates repositories and other dependencies. They follow a dependency injection pattern with request context awareness.

## Service Implementation Pattern

### 1. Service Interface Definition

Every service must define an interface that describes its public methods:

```typescript
export type IServiceName = {
  methodName(dto: SomeDto): Promise<ReturnType>;
  // ... other methods
};
```

### 2. Service Class Implementation

Services are implemented as classes that:
- Accept dependencies via constructor injection
- Accept `AuthRequestContext` for request-scoped data
- Implement the service interface
- Use the `notFound` check for dependent resource existence check.

```typescript
export class ServiceName implements IServiceName {
  constructor(
    private readonly dependencies: {
      readonly repositoryName: IRepositoryName;
      readonly helperName: IHelperName;
      // ... other dependencies
    },
    private readonly requestContext: AuthRequestContext
  ) {}

  async methodName(dto: SomeDto): Promise<ReturnType> {
    const { repositoryName, helperName } = this.dependencies;
    const { user: { id: userId }, requestDate } = this.requestContext;
    
    // Business logic implementation
    // ...
  }
}
```

### 3. Service Registration

Services must be registered in two places:

#### A. Service Index (`services/index.ts`)

```typescript
// Import the service interface
import type { IServiceName } from './service-name.service';

// Export the service interface and class
export { type IServiceName, ServiceName } from './service-name.service';

// Add to AuthServices type
export type AuthServices = {
  // ... existing services
  serviceName: () => IServiceName
}
```

#### B. Service Factory (`shared/service-factory.ts`)

```typescript
// Import the service class and interface
import { ServiceName, type IServiceName } from '$lib/server/services';

// Add service creator property
private readonly serviceNameCreator: ServiceCreatorFromRequestContext<IServiceName>;

// Initialize in constructor
this.serviceNameCreator = createServiceFromClass(
  ServiceName,
  { 
    repositoryName: this.repositoryName,
    helperName: this.helperName 
  }
);

// Add to getAuthServices method
public getAuthServices(authRequestContext: AuthRequestContext): AuthServices {
  return {
    // ... existing services
    serviceName: () => this.serviceNameCreator(authRequestContext),
  };
}
```

### 4. REST Path Comments (Required)

Add a concise "REST path" comment block directly above every public service method signature to document its HTTP method and route. This keeps API surface obvious and consistent for route handlers and other contributors.

Conventions:
- First line: Short description of the action
- Second line: `METHOD /path/:param` with route params prefixed by `:`
- Place the block immediately above the method definition

### 5. Authenticated User API Patterns

**CRITICAL**: Any service method with "User" in the name must follow these patterns:

#### URL Structure
- All authenticated user APIs MUST be prefixed with `/api/v1/users/me/`
- The "User" in the method name refers to the authenticated user, NOT a user in the request payload
- Examples:
  - `getUserChallenge` → `GET /api/v1/users/me/challenges/:challengeId`
  - `listChallengesOwnedByUser` → `GET /api/v1/users/me/challenges/owned`
  - `deleteUserChallenge` → `DELETE /api/v1/users/me/challenges/:challengeId`

#### Repository Ownership Checks
- All repository methods that power authenticated user APIs MUST include a `userId` ownership check
- Do NOT mix or reuse existing repositories that are not authenticated user facing
- Create separate repository methods for authenticated user operations
- Examples:
  ```typescript
  // ✅ Correct - includes userId ownership check
  async findByIdForUser(id: string, userId: string): Promise<Entity | null>
  async listOwnedByUser(userId: string, page: number, limit: number): Promise<Entity[]>
  
  // ❌ Incorrect - no ownership check
  async findById(id: string): Promise<Entity | null>
  ```

Examples:

```ts
/**
 * Create a new user challenge
 * POST /api/v1/user-challenges
 */
async createUserChallenge(dto: CreateUserChallengeDto): Promise<NewUserChallengeResponse> { /* ... */ }

/**
 * Get a user challenge by ID
 * GET /api/v1/user-challenges/:userChallengeId
 */
async getUserChallenge(dto: { userChallengeId: string }): Promise<UserChallengeDetailResponse> { /* ... */ }

/**
 * Update user challenge schedule
 * PATCH /api/v1/user-challenges/:userChallengeId/schedule
 */
async updateUserChallengeSchedule(dto: UpdateUserChallengeScheduleDto): Promise<void> { /* ... */ }

/**
 * Submit a quiz for a challenge article
 * POST /api/v1/user-challenges/:userChallengeId/quizzes/:knowledgeBaseId
 */
async submitUserChallengeQuiz(dto: SubmitUserChallengeQuizDto): Promise<void> { /* ... */ }

/**
 * List quiz submissions for a user challenge
 * GET /api/v1/user-challenges/:userChallengeId/quizzes
 */
async listUserChallengeQuizSubmissions(dto: ListUserChallengeQuizSubmissionsDto): Promise<UserChallengeProgressResponse[]> { /* ... */ }

/**
 * Put user challenge log
 * PUT /api/v1/logs/:logDate
 */
async putUserLog(dto: PutUserLogDto): Promise<void> { /* ... */ }

/**
 * List user challenge logs
 * GET /api/v1/logs
 */
async listUserLogs(dto: ListUserLogsDto): Promise<UserLogResponse[]> { /* ... */ }

/**
 * Update the authenticated user's profile preferences
 * PATCH /api/v1/users/me/profile
 */
async updateUserProfile(dto: UpdateUserProfileDto): Promise<void> { /* ... */ }

// ✅ Authenticated User API Examples (with "User" in method name)
/**
 * Get a challenge by its ID (owned by user)
 * GET /api/v1/users/me/challenges/:challengeId
 */
async getUserChallenge(dto: GetUserChallengeDto): Promise<GetUserChallengeResponse> { /* ... */ }

/**
 * List challenges owned by the authenticated user
 * GET /api/v1/users/me/challenges/owned
 */
async listChallengesOwnedByUser(dto: ListChallengesOwnedByUserDto): Promise<ListChallengesOwnedByUserResponse[]> { /* ... */ }

/**
 * List members of a challenge (only if user owns the challenge)
 * GET /api/v1/users/me/challenges/:challengeId/members
 */
async listChallengeMembers(dto: ListChallengeMembersDto): Promise<ListChallengeMembersResponse[]> { /* ... */ }

/**
 * List challenges joined by the authenticated user
 * GET /api/v1/users/me/challenges/joined
 */
async listChallengesJoinedByUser(dto: ListChallengesJoinedByUserDto): Promise<ListChallengesJoinedByUserResponse[]> { /* ... */ }

/**
 * Delete a user challenge (only if conditions are met)
 * DELETE /api/v1/users/me/challenges/:challengeId
 */
async deleteUserChallenge(dto: DeleteUserChallengeDto): Promise<void> { /* ... */ }

// ✅ Public/Content API Examples (no "User" in method name)
/**
 * Get a challenge by its ID
 * GET /api/v1/content/challenges/:challengeId
 */
getChallengeById(dto: { challengeId: string }): Challenge { /* ... */ }

/**
 * List all available challenges
 * GET /api/v1/content/challenges
 */
listAllChallenges(): Challenge[] { /* ... */ }
```

## Service Design Principles

### 1. Schema Decoupling

Services must NOT import directly from `schema.ts`. Instead:
- Use DTOs defined in `shared/interfaces.ts`
- Use repository interfaces for data access
- Let TypeScript infer types from DTOs and repository methods

### 2. Request Context Usage

Services receive `AuthRequestContext` containing:
- `requestDate`: Timestamp of the incoming request
- `requestId`: Unique request identifier
- `user`: Authenticated user information

Use these for:
- Setting `` timestamps
- User-specific operations
- Request tracing

### 3. DTO Pattern

Define DTOs in `shared/interfaces.ts`:

```typescript
// Input DTOs
export type UpdateEntityDto = {
  field1?: string | null;
  field2?: number | null;
  // undefined = ignore, null = clear field
};

// Response DTOs (if needed)
export type EntityResponse = {
  id: string;
  field1: string | null;
  field2: number | null;
  ?: string;
  ?: Date | string;
};
```

### 4. Null vs Undefined Handling

- `undefined` values in DTOs are ignored (no database update)
- `null` values explicitly clear the database field
- Always set `updated_at` to `requestDate` when updating

### 5. Error Handling

Use validation errors from `shared/errors.ts`:

```typescript
import { ValidationError } from '$lib/server/shared/errors';

if (someCondition) {
  throw new ValidationError('Descriptive error message');
}
```

## Example: User Profile Service

Here's a complete example following these patterns:

### Service Implementation
```typescript
// user-profile.service.ts
import { type AuthRequestContext } from '$lib/server/shared/interfaces';
import { type IUserRepository } from '$lib/server/repositories';
import type { UpdateUserProfileDto } from '$lib/server/shared/interfaces';
import type { User } from '../db/schema';

export type IUserProfileService = {
  updateUserProfile(dto: UpdateUserProfileDto): Promise<void>;
};

export class UserProfileService implements IUserProfileService {
  constructor(
    private readonly dependencies: {
      readonly userRepository: IUserRepository;
    },
    private readonly requestContext: AuthRequestContext
  ) {}

  async updateUserProfile(dto: UpdateUserProfileDto): Promise<void> {
    const { userRepository } = this.dependencies;
    const { user: { id: userId }, requestDate } = this.requestContext;

    // Build updates object: ignore undefined; allow null to explicitly clear fields
    const updates: Partial<User> = {};
    const allowedKeys = ['display_name', 'avatar_gender', 'avatar_age_range', 'personalizationCountryCodes', 'timezone', 'preferred_reminder_time', 'notification_preferences'] as const satisfies (keyof User & keyof UpdateUserProfileDto)[];

    const assignIfProvided = <T extends keyof User & keyof UpdateUserProfileDto>(key: T) => {
      if (dto[key] !== undefined) {
        updates[key] = dto[key]
      }
    };

    for (const key of allowedKeys) {
        assignIfProvided(key);
    }
  
    // Always bump  to request time
    updates. = requestDate;

    const updated = await userRepository.update(userId, updates);
  }
}
```

### DTO Definition
```typescript
// shared/interfaces.ts
type Nullable<T> = T | null;

export type UpdateUserProfileDto = {
  display_name?: Nullable<User['display_name']>;
  avatar_gender?: Nullable<User['avatar_gender']>;
  avatar_age_range?: Nullable<User['avatar_age_range']>;
  personalizationCountryCodes?: Nullable<User['personalizationCountryCodes']>;
  timezone?: Nullable<User['timezone']>;
  preferred_reminder_time?: Nullable<User['preferred_reminder_time']>;
  notification_preferences?: Nullable<User['notification_preferences']>;
};
```

## Testing Services

Services should be tested with:
- Mocked dependencies
- Mocked request context
- Focus on business logic validation
- Test both success and error scenarios

## Common Patterns

### 1. Bulk Operations
When updating multiple fields, use the pattern shown above with `allowedKeys` and type-safe assignment.

### 2. Validation
Perform validation early in service methods before calling repositories.

### 3. Transaction Handling
If multiple repository operations need to be atomic, consider using database transactions at the repository level.

### 4. Response Mapping
If returning data, map repository results to response DTOs to maintain schema decoupling.

## Service Dependencies

Common dependencies include:
- Repositories (for data access)
- DateTimeHelper (for date operations)
- Content DAOs (for content access)
- Other services (avoid circular dependencies)

Dependencies are injected via the constructor and accessed through `this.dependencies`.

## Repository Patterns for Authenticated User APIs

### Ownership Check Requirements

When implementing repository methods for authenticated user APIs:

1. **Always include userId parameter**: All methods must accept `userId` as a parameter
2. **Enforce ownership in queries**: Use `WHERE` clauses to ensure data belongs to the authenticated user
3. **Separate authenticated from public methods**: Don't mix authenticated user methods with public methods
4. **Use descriptive method names**: Include "ForUser" or "ByUser" in method names to indicate ownership

### Examples

```typescript
// ✅ Correct Repository Patterns
export interface IChallengesRepository {
  // Public methods (no ownership check)
  findById(id: string): Promise<Challenge | null>;
  listPublicUpcoming(page: number, limit: number): Promise<Challenge[]>;
  
  // Authenticated user methods (with ownership check)
  findByIdForUser(id: string, userId: string): Promise<Challenge | null>;
  listOwnedByUser(userId: string, page: number, limit: number): Promise<Challenge[]>;
  listMembers(challengeId: string, userId: string, page: number, limit: number): Promise<Member[]>;
  canDeleteChallenge(challengeId: string, userId: string): Promise<boolean>;
}

// ✅ Implementation with ownership checks
async findByIdForUser(id: string, userId: string): Promise<Challenge | null> {
  const [row] = await this.db
    .select()
    .from(challenges)
    .where(and(eq(challenges.id, id), eq(challenges.ownerUserId, userId)))
    .limit(1);
  return row ?? null;
}

// ❌ Incorrect - no ownership check
async findById(id: string): Promise<Challenge | null> {
  const [row] = await this.db
    .select()
    .from(challenges)
    .where(eq(challenges.id, id))
    .limit(1);
  return row ?? null;
}
```

### Security Benefits

- **Data Isolation**: Users can only access their own data
- **Authorization**: Ownership is enforced at the database level
- **Audit Trail**: Clear separation between public and authenticated operations
- **Type Safety**: Method signatures clearly indicate ownership requirements
