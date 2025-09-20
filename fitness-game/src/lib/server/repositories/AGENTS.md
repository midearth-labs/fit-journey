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
  update(id: string, updates: Partial<Entity>): Promise<boolean>;
  delete(id: string): Promise<boolean>;
  upsert(data: EntityData): Promise<boolean>;
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

  async update(id: string, updates: Partial<Entity>): Promise<boolean> {
    const result = await this.db.update(entities)
      .set(updates)
      .where(eq(entities.id, id));
    
    return result.rowCount > 0;
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

### 1. Atomic Operations (CRITICAL)

**ALWAYS prefer atomic operations over separate read-then-write patterns.** This prevents race conditions and ensures data consistency.

#### ❌ Avoid: Separate Check + Update
```typescript
// DON'T DO THIS - Race condition possible
async cancel(id: string, userId: string): Promise<boolean> {
  const existing = await this.findById(id, userId);
  if (!existing || existing.status === 'locked') {
    return false;
  }
  
  const result = await this.db.update(entities)
    .set({ status: 'inactive' })
    .where(eq(entities.id, id));
  
  return result.rowCount > 0;
}
```

#### ✅ Prefer: Atomic Conditional Update
```typescript
// DO THIS - Atomic operation
async cancel(id: string, userId: string): Promise<boolean> {
  const result = await this.db.update(entities)
    .set({ status: 'inactive' })
    .where(and(
      eq(entities.id, id),
      eq(entities.userId, userId),
      notInArray(entities.status, ['locked', 'inactive'])
    ));
  
  return result.rowCount > 0;
}
```

#### ✅ Prefer: Atomic Upsert
```typescript
// DO THIS - Atomic upsert
async upsert(data: EntityData): Promise<boolean> {
  const result = await this.db.insert(entities)
    .values(data)
    .onConflictDoUpdate({
      target: [entities.id],
      set: data
    });
  
  return result.rowCount > 0;
}
```

### 2. Schema Coupling

Repositories CAN import directly from `schema.ts` because they are the data access layer. This is expected and necessary for:
- Type definitions (`Entity`, `NewEntity`)
- Table references (`entities`)
- Database operations

### 3. Method Naming Conventions

- `create()` - Insert new entity
- `findById()` - Find by primary key
- `findByField()` - Find by specific field
- `update()` - Update existing entity
- `delete()` - Delete entity
- `upsert()` - Insert or update
- `list()` - Get multiple entities with filtering

### 4. Return Value Patterns

- `create()` - Returns the created entity
- `findById()` - Returns entity or null
- `update()` - Returns boolean indicating if any rows were affected
- `delete()` - Returns boolean indicating if any rows were affected
- `upsert()` - Returns boolean indicating if any rows were affected
- `list()` - Returns array of entities

#### Boolean Return Values for Mutations

**CRITICAL**: All update, upsert, and delete operations must return boolean values indicating whether any rows were affected. This allows services to:

1. **Detect Operation Failures**: Know if the operation actually modified data
2. **Handle Edge Cases**: Respond appropriately when no rows match the criteria
3. **Provide Better Error Messages**: Give users specific feedback about operation success
4. **Enable Proper Validation**: Ensure business logic constraints are met

```typescript
// ✅ CORRECT: Return boolean for affected rows
async update(id: string, updates: Partial<Entity>): Promise<boolean> {
  const result = await this.db.update(entities)
    .set(updates)
    .where(eq(entities.id, id));
  
  return result.rowCount > 0;
}

// ❌ AVOID: Returning the updated entity (unless specifically needed)
async update(id: string, updates: Partial<Entity>): Promise<Entity | null> {
  const result = await this.db.update(entities)
    .set(updates)
    .where(eq(entities.id, id))
    .returning();
  
  return result[0] || null;
}
```

**Exception**: Only return the updated entity when the service layer specifically needs the updated data for business logic or response mapping.

### 5. Error Handling

Repositories should let database errors bubble up to services. Services handle business logic validation, repositories handle data access.

### 6. Query Optimization

- Use `limit(1)` for single entity queries
- Use appropriate indexes for filtering
- Consider pagination for large result sets
- Use `returning()` for insert/update operations when you need the result
- **Prefer atomic operations over multiple database calls**

### 7. Avoiding N+1 Query Patterns (CRITICAL)

**NEVER implement N+1 query patterns in repositories.** This is a critical performance anti-pattern that can severely impact application performance.

#### ❌ Avoid: N+1 Query Pattern
```typescript
// DON'T DO THIS - N+1 queries
async listQuestionsWithArticles(articleId: string): Promise<QuestionWithArticles[]> {
  const questions = await this.db.select()
    .from(questions)
    .innerJoin(questionArticles, eq(questions.id, questionArticles.questionId))
    .where(eq(questionArticles.articleId, articleId));
  
  // This creates N+1 queries - one for each question!
  const questionsWithArticles = await Promise.all(
    questions.map(async (question) => {
      const articleAssociations = await this.db.select()
        .from(questionArticles)
        .where(eq(questionArticles.questionId, question.id));
      return { ...question, articleIds: articleAssociations.map(a => a.articleId) };
    })
  );
  
  return questionsWithArticles;
}
```

#### ✅ Prefer: Single Query with JOINs
```typescript
// DO THIS - Single query with proper JOINs
async listQuestionsWithArticles(articleId: string): Promise<QuestionWithArticles[]> {
  // First, get the question IDs for the specific article
  const questionIds = await this.db.select({ id: questions.id })
    .from(questions)
    .innerJoin(questionArticles, eq(questions.id, questionArticles.questionId))
    .where(eq(questionArticles.articleId, articleId));
  
  if (questionIds.length === 0) {
    return [];
  }
  
  // Get all questions with their article associations in a single query
  const result = await this.db.select({
    id: questions.id,
    title: questions.title,
    body: questions.body,
    // ... other question fields
    articleId: questionArticles.articleId,
  })
  .from(questions)
  .innerJoin(questionArticles, eq(questions.id, questionArticles.questionId))
  .where(sql`${questions.id} = ANY(${questionIds.map(q => q.id)})`);
  
  // Group by question and collect article IDs
  const questionMap = new Map<string, QuestionWithArticles>();
  
  for (const row of result) {
    const { articleId: _, ...questionData } = row;
    const questionId = questionData.id;
    
    if (!questionMap.has(questionId)) {
      questionMap.set(questionId, {
        ...questionData,
        articleIds: []
      });
    }
    
    questionMap.get(questionId)!.articleIds.push(row.articleId);
  }
  
  return Array.from(questionMap.values());
}
```

#### ✅ Alternative: Use Database Aggregation
```typescript
// Alternative approach using database aggregation
async listQuestionsWithArticles(articleId: string): Promise<QuestionWithArticles[]> {
  const result = await this.db.select({
    id: questions.id,
    title: questions.title,
    body: questions.body,
    // ... other question fields
    articleIds: sql<string[]>`array_agg(${questionArticles.articleId})`,
  })
  .from(questions)
  .innerJoin(questionArticles, eq(questions.id, questionArticles.questionId))
  .where(eq(questionArticles.articleId, articleId))
  .groupBy(questions.id, questions.title, questions.body);
  
  return result.map(row => ({
    ...row,
    articleIds: row.articleIds || []
  }));
}
```

#### Key Principles for Avoiding N+1:

1. **Single Query Strategy**: Always prefer one query over multiple queries
2. **JOIN When Possible**: Use JOINs to fetch related data in one query
3. **Group Results**: Use Map/Set to group related data after fetching
4. **Database Aggregation**: Use SQL aggregation functions when appropriate
5. **Batch Operations**: When you must make multiple queries, batch them together

#### When N+1 Might Seem Necessary:

- **Large Result Sets**: If you're dealing with thousands of records, consider pagination
- **Complex Relationships**: Use subqueries or CTEs instead of N+1
- **Conditional Loading**: Use optional JOINs with LEFT JOIN instead of separate queries

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

#### Simple Upsert
```typescript
async upsert(
  where: { userId: string; date: string },
  data: Partial<Entity>
): Promise<boolean> {
  const result = await this.db.insert(entities)
    .values({ ...where, ...data })
    .onConflictDoUpdate({
      target: [entities.userId, entities.date],
      set: data
    });
  
  return result.rowCount > 0;
}
```

#### Complex Upsert with Multiple Operations

For upsert operations that involve both insert/update and delete operations (e.g., handling null values), track affected rows across all operations:

```typescript
async upsert(
  baseData: { userId: string; date: string },
  values: Array<{ key: string; value: any }>
): Promise<boolean> {
  const definedValues: Array<{ key: string; value: any }> = [];
  const keysToDelete: Array<string> = [];
  
  // Partition values into defined, null, and undefined groups
  values.forEach(value => {
    if (value.value === null) {
      keysToDelete.push(value.key);
    } else if (value.value !== undefined) {
      definedValues.push(value);
    }
    // undefined values are ignored
  });

  if (keysToDelete.length === 0 && definedValues.length === 0) {
    return false;
  }

  let affectedRows = 0;
  
  // Execute operations in a transaction
  await this.db.transaction(async (tx) => {
    // Handle defined values with upsert logic
    if (definedValues.length > 0) {
      const insertData = definedValues.map(value => ({
        ...baseData,
        key: value.key,
        value: value.value
      }));

      const insertResult = await tx
        .insert(entities)
        .values(insertData)
        .onConflictDoUpdate({
          target: [entities.userId, entities.key, entities.date],
          set: { value: sql`EXCLUDED.value` }
        });
      
      affectedRows += insertResult.rowCount;
    }

    // Handle null values by deleting corresponding entries
    if (keysToDelete.length > 0) {
      const deleteResult = await tx
        .delete(entities)
        .where(
          and(
            eq(entities.userId, baseData.userId),
            eq(entities.date, baseData.date),
            inArray(entities.key, keysToDelete)
          )
        );
      
      affectedRows += deleteResult.rowCount;
    }
  });
  
  return affectedRows > 0;
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
): Promise<boolean> {
  return await this.db.transaction(async (tx) => {
    const result = await tx.update(entities)
      .set(updates)
      .where(eq(entities.id, id));
    
    await additionalOperations(tx);
    
    return result.rowCount > 0;
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
  update(userId: string, updates: Partial<User>): Promise<boolean>;
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

  async update(userId: string, updates: Partial<User>): Promise<boolean> {
    const result = await this.db.update(users)
      .set(updates)
      .where(eq(users.id, userId));
    
    return result.rowCount > 0;
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

1. **Atomic Operations**: ALWAYS prefer atomic operations over separate read-then-write patterns
2. **Single Responsibility**: Each repository should handle one entity type
3. **Consistent Naming**: Use consistent method names across repositories
4. **Type Safety**: Leverage TypeScript for compile-time safety
5. **Error Handling**: Let database errors bubble up to services
6. **Performance**: Use appropriate indexes and query optimization
7. **Testing**: Write comprehensive tests for data access logic
8. **Documentation**: Document complex queries and business rules
9. **Return Values**: Update/upsert/delete methods should return boolean indicating affected rows
10. **Service Integration**: Services should check boolean return values to handle operation failures
