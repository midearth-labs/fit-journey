# Shared Layer Implementation Guide

This document outlines the patterns and conventions for implementing shared components in this fitness game application.

## Shared Layer Overview

The shared layer contains common interfaces, DTOs, error types, and utility functions used across services and repositories.

## Core Components

### 1. Interfaces (`interfaces.ts`)

This file contains all shared type definitions, DTOs, and interfaces.

#### DTO Pattern

DTOs (Data Transfer Objects) define the contract for data exchange between layers:

```typescript
// Input DTOs - for incoming requests
export type UpdateEntityDto = {
  field1?: string | null;
  field2?: number | null;
  // undefined = ignore, null = clear field
};

// Response DTOs - for outgoing responses
export type EntityResponse = {
  id: string;
  field1: string | null;
  field2: number | null;
  created_at?: string;
  updated_at?: Date | string;
};
```

#### Nullable Type Helper

Use the `Nullable` helper for optional fields that can be explicitly cleared:

```typescript
type Nullable<T> = T | null;

export type UpdateUserProfileDto = {
  display_name?: Nullable<User['display_name']>;
  avatar_gender?: Nullable<User['avatar_gender']>;
  // ... other fields
};
```

#### AuthRequestContext

Every service receives this context containing request-scoped data:

```typescript
export type AuthRequestContext = {
  requestDate: Date; // the timestamp/instant of the incoming request
  requestId: string; // the requestId UUID of the request
  user: {
    id: string;
    email?: string;
    created_at: string;
  }
};
```

### 2. Service Factory (`service-factory.ts`)

The ServiceFactory handles dependency injection and service instantiation.

#### Service Registration Pattern

```typescript
// 1. Import service class and interface
import { ServiceName, type IServiceName } from '$lib/server/services';

// 2. Add service creator property
private readonly serviceNameCreator: ServiceCreatorFromRequestContext<IServiceName>;

// 3. Initialize in constructor
this.serviceNameCreator = createServiceFromClass(
  ServiceName,
  { 
    repositoryName: this.repositoryName,
    helperName: this.helperName 
  }
);

// 4. Add to getAuthServices method
public getAuthServices(authRequestContext: AuthRequestContext): AuthServices {
  return {
    // ... existing services
    serviceName: () => this.serviceNameCreator(authRequestContext),
  };
}
```

#### Repository Registration Pattern

```typescript
// 1. Import repository
import { RepositoryName } from '$lib/server/repositories';

// 2. Add repository property
private readonly repositoryName: RepositoryName;

// 3. Initialize in constructor
this.repositoryName = new RepositoryName(db);
```

### 3. Service Creation Utilities (`services/shared.ts`)

Provides utilities for creating services with dependency injection:

```typescript
export type ServiceCreatorFromRequestContext<S> = (requestContext: AuthRequestContext) => S;
export type ServiceCreatorFromDependencies<D, S> = (dependencies: D) => ServiceCreatorFromRequestContext<S>;

export const createServiceFromClass = <D, S>(
    ServiceClass: new (dependencies: D, requestContext: AuthRequestContext) => S,
    dependencies: D,
  ): ServiceCreatorFromRequestContext<S> => 
        (requestContext: AuthRequestContext) => 
            new ServiceClass(dependencies, requestContext);
```

### 4. Error Handling (`errors.ts`)

Common error types for consistent error handling:

```typescript
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

## Design Principles

### 1. Schema Decoupling

- Services must NOT import directly from `schema.ts`
- Use DTOs and repository interfaces instead
- Let TypeScript infer types from DTOs and repository methods
- Repositories CAN import from `schema.ts` (they are the data access layer)

### 2. Type Safety

- Use TypeScript's type system to ensure compile-time safety
- Leverage `satisfies` for type checking without widening
- Use generic constraints for type-safe operations

### 3. Null vs Undefined Semantics

- `undefined` in DTOs means "ignore this field" (no database update)
- `null` in DTOs means "explicitly clear this field" (set to null in database)
- Always set `updated_at` to `requestDate` when updating entities

### 4. Request Context Usage

- Use `requestDate` for timestamps (not `new Date()`)
- Use `requestId` for tracing and logging
- Use `user.id` for user-specific operations

## Common Patterns

### 1. Bulk Field Updates

When updating multiple fields with null/undefined handling:

```typescript
const updates: Partial<Entity> = {};
const allowedKeys = ['field1', 'field2', 'field3'] as const satisfies (keyof Entity & keyof UpdateDto)[];

const assignIfProvided = <T extends keyof Entity & keyof UpdateDto>(key: T) => {
  if (dto[key] !== undefined) {
    updates[key] = dto[key]
  }
};

for (const key of allowedKeys) {
    assignIfProvided(key);
}

// Always bump updated_at to request time
updates.updated_at = requestDate;
```

### 2. Service Dependencies

Define service dependencies as a typed object:

```typescript
constructor(
  private readonly dependencies: {
    readonly repositoryName: IRepositoryName;
    readonly helperName: IHelperName;
  },
  private readonly requestContext: AuthRequestContext
) {}
```

### 3. Repository Dependencies

Define repository dependencies in constructor:

```typescript
constructor(
  private db: NodePgDatabase<any>,
  private dateTimeHelper: IDateTimeHelper,
  private contentDAO: IContentDAO
) {}
```

## File Organization

### interfaces.ts Structure

```typescript
// --- Data Structures ---
import { type UserAnswer, type DailyLogPayload, ... } from "$lib/server/db/schema";

// --- Service Types (for Dependency Injection) ---

// --- Auth Context ---
export type AuthRequestContext = { ... };

// --- Challenge System Types ---
export type CreateUserChallengeDto = { ... };
export type UpdateUserChallengeScheduleDto = { ... };

// --- Response Types ---
export type UserChallengeSummaryResponse = { ... };

// --- User Profile DTOs ---
export type UpdateUserProfileDto = { ... };
export type UserProfileResponse = { ... };
```

### Service Factory Structure

```typescript
export class ServiceFactory {
  // Content and helpers
  private readonly contentDAOFactory: ContentDAOFactory;
  private readonly dateTimeHelper: DateTimeHelper;
  
  // Repositories
  private readonly userRepository: UserRepository;
  private readonly userMetadataRepository: UserMetadataRepository;
  
  // Service creators
  private readonly challengeServiceCreator: ServiceCreatorFromRequestContext<IChallengeService>;
  private readonly userProfileServiceCreator: ServiceCreatorFromRequestContext<IUserProfileService>;
  
  // Constructor - initialize all dependencies
  // getInstance() - singleton pattern
  // getAuthServices() - return service factory functions
  // getRepositories() - return repository instances
}
```

## Testing Shared Components

### 1. DTO Testing

Test DTO validation and transformation:

```typescript
describe('UpdateUserProfileDto', () => {
  it('should handle undefined values correctly', () => {
    const dto: UpdateUserProfileDto = {
      display_name: undefined, // should be ignored
      avatar_gender: null,     // should clear field
    };
    // Test the service behavior
  });
});
```

### 2. Service Factory Testing

Test dependency injection and service creation:

```typescript
describe('ServiceFactory', () => {
  it('should create services with correct dependencies', async () => {
    const factory = await ServiceFactory.getInstance();
    const authServices = factory.getAuthServices(mockRequestContext);
    
    const userProfileService = authServices.userProfileService();
    expect(userProfileService).toBeInstanceOf(UserProfileService);
  });
});
```

## Best Practices

1. **Consistent Naming**: Use consistent naming conventions across all shared components
2. **Type Safety**: Leverage TypeScript's type system for compile-time safety
3. **Documentation**: Document complex types and their usage
4. **Testing**: Write comprehensive tests for shared utilities
5. **Error Handling**: Use consistent error types and messages
6. **Performance**: Consider the performance implications of type definitions
7. **Maintainability**: Keep shared components focused and cohesive

## Common Pitfalls

1. **Schema Coupling**: Don't import schema types in services
2. **Type Widening**: Use `satisfies` to prevent type widening
3. **Null Handling**: Be explicit about null vs undefined semantics
4. **Circular Dependencies**: Avoid circular imports between services
5. **Over-Engineering**: Keep shared components simple and focused
