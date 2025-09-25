# Server Layer Architecture Guide

This document provides a high-level overview of the server architecture and how all components work together.

## Architecture Overview

The server follows a layered architecture with clear separation of concerns:

```
┌─────────────────────────────────────┐
│           API Routes                 │
├─────────────────────────────────────┤
│           Services                   │
├─────────────────────────────────────┤
│         Repositories                 │
├─────────────────────────────────────┤
│         Database Schema              │
└─────────────────────────────────────┘
```

## Component Relationships

### 1. Service Factory Pattern

The `ServiceFactory` is the central orchestrator that:
- Manages all dependencies
- Creates service instances with proper dependency injection
- Provides a singleton pattern for consistent service access

```typescript
// Usage in API routes
const serviceFactory = await ServiceFactory.getInstance();
const authServices = serviceFactory.getAuthServices(requestContext);
const userProfileService = authServices.userProfileService();
```

### 2. Dependency Injection Flow

```
ServiceFactory
├── Repositories (data access)
├── Helpers (utilities)
├── Content DAOs (content access)
└── Services (business logic)
    ├── Dependencies injected via constructor
    └── Request context provided per request
```

### 3. Data Flow

```
API Request
├── AuthRequestContext (user, requestDate, requestId)
├── Service Layer (business logic)
├── Repository Layer (data access)
├── Database (PostgreSQL via Drizzle)
└── Response (DTOs)
```

## Implementation Checklist

When implementing new functionality, follow this checklist:

### 1. Define DTOs in `shared/interfaces.ts`

```typescript
// Input DTO
export type UpdateEntityDto = {
  field1?: string | null;
  field2?: number | null;
};

// Response DTO (if needed)
export type EntityResponse = {
  id: string;
  field1: string | null;
  field2: number | null;
};
```

### 2. Create/Update Repository

```typescript
// repositories/entity.repository.ts
export interface IEntityRepository {
  update(id: string, updates: Partial<Entity>): Promise<Entity | null>;
  findById(id: string): Promise<Entity | null>;
}

export class EntityRepository implements IEntityRepository {
  constructor(private db: NodePgDatabase<any>) {}
  
  // Implementation...
}
```

### 3. Export Repository

```typescript
// repositories/index.ts
export { type IEntityRepository, EntityRepository } from './entity.repository';
```

### 4. Create Service

```typescript
// services/entity.service.ts
export type IEntityService = {
  updateEntity(dto: UpdateEntityDto): Promise<void>;
};

export class EntityService implements IEntityService {
  constructor(
    private readonly dependencies: {
      readonly entityRepository: IEntityRepository;
    },
    private readonly requestContext: AuthRequestContext
  ) {}
  
  // Implementation...
}
```

### 5. Export Service

```typescript
// services/index.ts
export { type IEntityService, EntityService } from './entity.service';

export type AuthServices = {
  // ... existing services
  entityService: () => IEntityService
}
```

### 6. Register in ServiceFactory

```typescript
// shared/service-factory.ts
// Import
import { EntityService, type IEntityService } from '$lib/server/services';
import { EntityRepository } from '$lib/server/repositories';

// Add properties
private readonly entityRepository: EntityRepository;
private readonly entityServiceCreator: ServiceCreatorFromRequestContext<IEntityService>;

// Initialize in constructor
this.entityRepository = new EntityRepository(db);
this.entityServiceCreator = createServiceFromClass(
  EntityService,
  { entityRepository: this.entityRepository }
);

// Add to getAuthServices
entityService: () => this.entityServiceCreator(authRequestContext),
```

## Key Design Principles

### 1. Schema Decoupling

- **Services**: Must NOT import from `schema.ts`
- **Repositories**: CAN import from `schema.ts` (they are the data access layer)
- **Shared**: Use DTOs and interfaces, not db schema types

### 2. Dependency Injection

- All dependencies injected via constructor
- ServiceFactory manages all dependency creation
- Services receive request context per request

### 3. Type Safety

- Use TypeScript's type system extensively
- Leverage `satisfies` for type checking
- Define clear interfaces for all components

### 4. Error Handling

- Use consistent error types from `shared/errors.ts`
- Let database errors bubble up to services
- Services handle business logic validation

## Common Patterns

### 1. Service Method Pattern

```typescript
async methodName(dto: SomeDto): Promise<ReturnType> {
  const { repositoryName, helperName } = this.dependencies;
  const { user: { id: userId }, requestDate } = this.requestContext;
  
  // Validation
  if (someCondition) {
    throw new ValidationError('Error message');
  }
  
  // Business logic
  const result = await repositoryName.someMethod(userId, dto);
  
  // Response mapping (if needed)
  return this.mapToResponse(result);
}
```

### 2. Repository Method Pattern

```typescript
async methodName(id: string, data: SomeData): Promise<Entity | null> {
  const result = await this.db.select()
    .from(entities)
    .where(eq(entities.id, id))
    .limit(1);
  
  return result[0] || null;
}
```

### 3. DTO Update Pattern

```typescript
const updates: Partial<Entity> = {};
const allowedKeys = ['field1', 'field2'] as const satisfies (keyof Entity & keyof UpdateDto)[];

const assignIfProvided = <T extends keyof Entity & keyof UpdateDto>(key: T) => {
  if (dto[key] !== undefined) {
    updates[key] = dto[key]
  }
};

for (const key of allowedKeys) {
    assignIfProvided(key);
}

updates. = requestDate;
```

## Testing Strategy

### 1. Unit Tests

- **Services**: Mock dependencies, test business logic
- **Repositories**: Use test database, test data access
- **Shared**: Test utilities and type definitions

### 2. Integration Tests

- Test service + repository integration
- Test API route + service integration
- Use test database for realistic scenarios

### 3. E2E Tests

- Test complete user workflows
- Use Playwright for browser automation
- Test authentication and authorization

## Performance Considerations

### 1. Database Queries

- Use appropriate indexes
- Limit result sets with pagination
- Use `limit(1)` for single entity queries
- Consider query optimization

### 2. Service Instantiation

- ServiceFactory uses singleton pattern
- Services created per request (lightweight)
- Dependencies created once and reused

### 3. Memory Usage

- Use streaming for large datasets
- Implement proper cleanup
- Monitor memory usage in production

## Security Considerations

### 1. Authentication

- All services receive authenticated user context
- User ID validated at service layer
- No direct database access from API routes

### 2. Authorization

- Implement role-based access control
- Validate permissions at service layer
- Use repository methods for data access

### 3. Input Validation

- Validate all inputs at service layer
- Use DTOs for type safety
- Sanitize user inputs

## Monitoring and Logging

### 1. Request Tracing

- Use `requestId` for request tracing
- Log service method calls
- Track performance metrics

### 2. Error Handling

- Log errors with context
- Use structured logging
- Implement error reporting

### 3. Metrics

- Track service performance
- Monitor database queries
- Measure user engagement

## Deployment Considerations

### 1. Environment Configuration

- Use environment variables for configuration
- Separate development/staging/production configs
- Secure sensitive data

### 2. Database Migrations

- Use Drizzle migrations
- Test migrations in staging
- Backup before production migrations

### 3. Scaling

- Design for horizontal scaling
- Use connection pooling
- Implement caching strategies

## Best Practices Summary

1. **Follow the layered architecture**
2. **Use dependency injection consistently**
3. **Maintain schema decoupling**
4. **Write comprehensive tests**
5. **Handle errors gracefully**
6. **Use TypeScript effectively**
7. **Document complex logic**
8. **Monitor performance**
9. **Secure all endpoints**
10. **Plan for scaling**
