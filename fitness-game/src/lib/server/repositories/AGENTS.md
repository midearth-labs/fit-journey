# Repository Layer Implementation Guide

This document outlines the patterns and conventions for implementing repositories in this fitness game application.

## Repository Architecture Overview

Repositories are the data access layer that abstracts database operations. They provide a clean interface between services and the database schema.

## Repository Implementation Pattern

### 1. Repository Interface Definition

Every repository must define an interface that describes its public methods:

```typescript
export interface IRepositoryName {
  create(data: NewEntity): Promise<Entity>;
  findById(id: string): Promise<Entity | null>;
  update(id: string, updates: Partial<Entity>): Promise<Entity | null>;
  delete(id: string): Promise<boolean>;
  // ... other methods
}
```

### 2. Repository Class Implementation

Repositories are implemented as classes that:
- Accept Drizzle database instance via constructor injection
- Implement the repository interface
- Use Drizzle ORM for database operations

```typescript
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { entities, type Entity, type NewEntity } from '$lib/server/db/schema';

export class RepositoryName implements IRepositoryName {
  constructor(private db: NodePgDatabase<any>) {}

  async create(data: NewEntity): Promise<Entity> {
    const result = await this.db.insert(entities)
      .values(data)
      .returning();
    return result[0];
  }

  async findById(id: string): Promise<Entity | null> {
    const result = await this.db.select()
      .from(entities)
      .where(eq(entities.id, id))
      .limit(1);
    
    return result[0] || null;
  }

  async update(id: string, updates: Partial<Entity>): Promise<Entity | null> {
    const result = await this.db.update(entities)
      .set(updates)
      .where(eq(entities.id, id))
      .returning();
    
    return result[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.delete(entities)
      .where(eq(entities.id, id));
    
    return result.rowCount > 0;
  }
}
```

### 3. Repository Registration

Repositories must be registered in two places:

#### A. Repository Index (`repositories/index.ts`)

```typescript
export { type IRepositoryName, RepositoryName } from './repository-name.repository';
```

#### B. Service Factory (`shared/service-factory.ts`)

```typescript
// Import the repository
import { RepositoryName } from '$lib/server/repositories';

// Add repository property
private readonly repositoryName: RepositoryName;

// Initialize in constructor
this.repositoryName = new RepositoryName(db);
```

## Repository Design Principles

### 1. Schema Coupling

Repositories CAN import directly from `schema.ts` because they are the data access layer. This is expected and necessary for:
- Type definitions (`Entity`, `NewEntity`)
- Table references (`entities`)
- Database operations

### 2. Method Naming Conventions

- `create()` - Insert new entity
- `findById()` - Find by primary key
- `findByField()` - Find by specific field
- `update()` - Update existing entity
- `delete()` - Delete entity
- `upsert()` - Insert or update
- `list()` - Get multiple entities with filtering

### 3. Return Value Patterns

- `create()` - Returns the created entity
- `findById()` - Returns entity or null
- `update()` - Returns updated entity or null
- `delete()` - Returns boolean success indicator
- `list()` - Returns array of entities

### 4. Error Handling

Repositories should let database errors bubble up to services. Services handle business logic validation, repositories handle data access.

### 5. Query Optimization

- Use `limit(1)` for single entity queries
- Use appropriate indexes for filtering
- Consider pagination for large result sets
- Use `returning()` for insert/update operations when you need the result

## Advanced Repository Patterns

### 1. Complex Queries

For complex queries, create dedicated methods:

```typescript
async findByUserAndDateRange(
  userId: string, 
  fromDate?: string, 
  toDate?: string
): Promise<Entity[]> {
  let query = this.db.select()
    .from(entities)
    .where(eq(entities.userId, userId));

  if (fromDate) {
    query = query.where(gte(entities.date, fromDate));
  }
  
  if (toDate) {
    query = query.where(lte(entities.date, toDate));
  }

  return query;
}
```

### 2. Upsert Operations

```typescript
async upsert(
  where: { userId: string; date: string },
  data: Partial<Entity>
): Promise<Entity> {
  const result = await this.db.insert(entities)
    .values({ ...where, ...data })
    .onConflictDoUpdate({
      target: [entities.userId, entities.date],
      set: data
    })
    .returning();
  
  return result[0];
}
```

### 3. Batch Operations

```typescript
async createMany(data: NewEntity[]): Promise<Entity[]> {
  const result = await this.db.insert(entities)
    .values(data)
    .returning();
  
  return result;
}
```

### 4. Transaction Support

```typescript
async updateWithTransaction(
  id: string, 
  updates: Partial<Entity>,
  additionalOperations: (tx: any) => Promise<void>
): Promise<Entity | null> {
  return await this.db.transaction(async (tx) => {
    const result = await tx.update(entities)
      .set(updates)
      .where(eq(entities.id, id))
      .returning();
    
    await additionalOperations(tx);
    
    return result[0] || null;
  });
}
```

## Repository Dependencies

Common dependencies include:
- Database instance (`NodePgDatabase`)
- DateTimeHelper (for date operations)
- Content DAOs (for content validation)

Dependencies are injected via constructor:

```typescript
export class ComplexRepository implements IComplexRepository {
  constructor(
    private db: NodePgDatabase<any>,
    private dateTimeHelper: IDateTimeHelper,
    private contentDAO: IContentDAO
  ) {}
}
```

## Testing Repositories

Repositories should be tested with:
- In-memory database or test database
- Mock data
- Focus on data access logic
- Test edge cases (not found, empty results, etc.)

## Common Drizzle Patterns

### 1. Conditional Where Clauses

```typescript
let query = this.db.select().from(entities);

if (userId) {
  query = query.where(eq(entities.userId, userId));
}

if (status) {
  query = query.where(eq(entities.status, status));
}

return query;
```

### 2. Ordering and Pagination

```typescript
async findWithPagination(
  limit: number = 10,
  offset: number = 0
): Promise<Entity[]> {
  return await this.db.select()
    .from(entities)
    .orderBy(desc(entities.createdAt))
    .limit(limit)
    .offset(offset);
}
```

### 3. Joins

```typescript
async findWithRelations(id: string): Promise<EntityWithRelations | null> {
  const result = await this.db.select()
    .from(entities)
    .leftJoin(relatedTable, eq(entities.id, relatedTable.entityId))
    .where(eq(entities.id, id))
    .limit(1);
  
  return result[0] || null;
}
```

## Example: User Repository

Here's a complete example following these patterns:

```typescript
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { users, type User, type NewUser } from '$lib/server/db/schema';

export interface IUserRepository {
  update(userId: string, updates: Partial<User>): Promise<User | null>;
  findById(userId: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
}

export interface IUserInternalRepository {
  create(userData: NewUser): Promise<User>;
  delete(userId: string): Promise<boolean>;
}

export class UserRepository implements IUserRepository, IUserInternalRepository {
  constructor(private db: NodePgDatabase<any>) {}

  async create(userData: NewUser): Promise<User> {
    const result = await this.db.insert(users)
      .values(userData)
      .returning();
    return result[0];
  }

  async update(userId: string, updates: Partial<User>): Promise<User | null> {
    const result = await this.db.update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning();
    
    return result[0] || null;
  }

  async delete(userId: string): Promise<boolean> {
    const result = await this.db.delete(users)
      .where(eq(users.id, userId));
    
    return result.rowCount > 0;
  }

  async findById(userId: string): Promise<User | null> {
    const result = await this.db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    return result[0] || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.db.select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    return result[0] || null;
  }
}
```

## Best Practices

1. **Single Responsibility**: Each repository should handle one entity type
2. **Consistent Naming**: Use consistent method names across repositories
3. **Type Safety**: Leverage TypeScript for compile-time safety
4. **Error Handling**: Let database errors bubble up to services
5. **Performance**: Use appropriate indexes and query optimization
6. **Testing**: Write comprehensive tests for data access logic
7. **Documentation**: Document complex queries and business rules
