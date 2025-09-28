# Server Architecture and Design Patterns - FitJourney

This document outlines the server-side architecture, API design, and backend patterns within the `src/lib/server` directory, focusing on maintainable, scalable, and type-safe backend development.

## Architecture Overview

The server layer follows a modern Node.js architecture with:
- **API Routes**: RESTful endpoints with Zod validation
- **Database Layer**: PostgreSQL with Drizzle ORM
- **Authentication**: Supabase-based auth with session management
- **Services**: Business logic and data processing
- **Repositories**: Data access layer abstraction
- **Schemas**: Type-safe request/response validation

## Design System - Backend Architecture

### Core Design Principles

**1. Type Safety First**
- **Zod Schemas**: All API endpoints use Zod for validation
- **TypeScript**: Strict typing throughout the codebase
- **Drizzle ORM**: Type-safe database operations
- **API Client**: Generated types from server schemas

**2. Layered Architecture**
```
API Routes → Services → Repositories → Database
     ↓           ↓           ↓
  Validation  Business   Data Access
             Logic      Layer
```

**3. Error Handling**
- **Consistent Error Responses**: Standardized error format
- **HTTP Status Codes**: Proper status code usage
- **Error Boundaries**: Graceful error handling
- **Logging**: Comprehensive error logging

**4. Security Patterns**
- **Authentication**: Supabase session-based auth
- **Authorization**: Role-based access control
- **Input Validation**: Zod schema validation
- **SQL Injection Prevention**: Drizzle ORM protection

## Directory Structure

```
src/lib/server/
├── shared/              # Shared utilities and schemas
│   ├── schemas.ts      # Zod validation schemas
│   ├── constants.ts    # Application constants
│   └── types.ts        # Shared type definitions
├── db/                 # Database configuration
│   ├── schema.ts       # Drizzle schema definitions
│   └── connection.ts   # Database connection
├── repositories/       # Data access layer
├── services/          # Business logic layer
├── helpers/           # Utility functions
└── scripts/          # Development and maintenance scripts
```

## API Design Patterns

### Request/Response Schema Pattern

**Zod Schema Definition**:
```typescript
// Example: User Profile Update
export const UpdateUserProfileSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  avatarGender: z.enum(['male', 'female', 'non-binary']).optional(),
  avatarAgeRange: z.enum(['teen', 'young-adult', 'adult', 'senior']).optional(),
  personalizationCountryCodes: z.array(z.string().length(2)).optional(),
  timezone: z.string().optional(),
  preferredReminderTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  notificationPreferences: z.object({
    email: z.boolean().optional(),
    push: z.boolean().optional(),
    sms: z.boolean().optional()
  }).optional()
});

export type UpdateUserProfileRequest = z.infer<typeof UpdateUserProfileSchema>;
```

**API Route Implementation**:
```typescript
// PATCH /api/v1/users/me/profile
export async function PATCH({ request, locals }: RequestEvent) {
  try {
    const body = await request.json();
    const validatedData = UpdateUserProfileSchema.parse(body);
    
    const updatedProfile = await userService.updateProfile(
      locals.session.user.id, 
      validatedData
    );
    
    return json({ success: true, data: updatedProfile });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### Error Handling Pattern

**Standardized Error Response**:
```typescript
interface ApiError {
  error: string;
  details?: any;
  code?: string;
}

// Error handling utility
export function handleApiError(error: unknown): Response {
  if (error instanceof z.ZodError) {
    return json({
      error: 'Validation failed',
      details: error.errors,
      code: 'VALIDATION_ERROR'
    }, { status: 400 });
  }
  
  if (error instanceof DatabaseError) {
    return json({
      error: 'Database operation failed',
      code: 'DATABASE_ERROR'
    }, { status: 500 });
  }
  
  return json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  }, { status: 500 });
}
```

## Database Layer

### Drizzle Schema Patterns

**User Profile Schema**:
```typescript
export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  displayName: varchar('display_name', { length: 100 }),
  avatarGender: varchar('avatar_gender', { length: 20 }),
  avatarAgeRange: varchar('avatar_age_range', { length: 20 }),
  personalizationCountryCodes: json('personalization_country_codes').$type<string[]>(),
  timezone: varchar('timezone', { length: 50 }),
  preferredReminderTime: varchar('preferred_reminder_time', { length: 5 }),
  notificationPreferences: json('notification_preferences').$type<NotificationPreferences>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});
```

**Relationships**:
```typescript
export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, {
    fields: [userProfiles.userId],
    references: [users.id]
  })
}));
```

### Repository Pattern

**Base Repository**:
```typescript
export abstract class BaseRepository<T> {
  protected db: DrizzleDatabase;
  
  constructor(db: DrizzleDatabase) {
    this.db = db;
  }
  
  protected async executeQuery<R>(query: () => Promise<R>): Promise<R> {
    try {
      return await query();
    } catch (error) {
      console.error('Database query failed:', error);
      throw new DatabaseError('Query execution failed');
    }
  }
}
```

**User Profile Repository**:
```typescript
export class UserProfileRepository extends BaseRepository<UserProfile> {
  async findByUserId(userId: string): Promise<UserProfile | null> {
    return this.executeQuery(async () => {
      const result = await this.db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, userId))
        .limit(1);
      
      return result[0] || null;
    });
  }
  
  async update(userId: string, data: Partial<UserProfile>): Promise<UserProfile> {
    return this.executeQuery(async () => {
      const result = await this.db
        .update(userProfiles)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(userProfiles.userId, userId))
        .returning();
      
      if (!result[0]) {
        throw new NotFoundError('User profile not found');
      }
      
      return result[0];
    });
  }
}
```

## Service Layer

### Business Logic Patterns

**User Service**:
```typescript
export class UserService {
  private profileRepository: UserProfileRepository;
  
  constructor(db: DrizzleDatabase) {
    this.profileRepository = new UserProfileRepository(db);
  }
  
  async updateProfile(userId: string, data: UpdateUserProfileRequest): Promise<UserProfile> {
    // Validate business rules
    if (data.preferredReminderTime) {
      this.validateReminderTime(data.preferredReminderTime);
    }
    
    if (data.personalizationCountryCodes) {
      this.validateCountryCodes(data.personalizationCountryCodes);
    }
    
    // Update profile
    const updatedProfile = await this.profileRepository.update(userId, data);
    
    // Trigger side effects
    await this.updateUserPreferences(userId, data);
    
    return updatedProfile;
  }
  
  private validateReminderTime(time: string): void {
    const [hours, minutes] = time.split(':').map(Number);
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      throw new ValidationError('Invalid reminder time format');
    }
  }
  
  private validateCountryCodes(codes: string[]): void {
    const validCodes = ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'ES', 'IT'];
    const invalidCodes = codes.filter(code => !validCodes.includes(code));
    if (invalidCodes.length > 0) {
      throw new ValidationError(`Invalid country codes: ${invalidCodes.join(', ')}`);
    }
  }
}
```

### Challenge Service Pattern

**Challenge Management**:
```typescript
export class ChallengeService {
  private challengeRepository: ChallengeRepository;
  private userChallengeRepository: UserChallengeRepository;
  
  async createChallenge(userId: string, data: CreateChallengeRequest): Promise<Challenge> {
    // Validate challenge data
    this.validateChallengeData(data);
    
    // Create challenge
    const challenge = await this.challengeRepository.create({
      ...data,
      ownerId: userId,
      status: 'not_started'
    });
    
    // Auto-join creator
    await this.userChallengeRepository.create({
      userId,
      challengeId: challenge.id,
      joinedAt: new Date()
    });
    
    return challenge;
  }
  
  async joinChallenge(userId: string, challengeId: string, inviteCode?: string): Promise<void> {
    const challenge = await this.challengeRepository.findById(challengeId);
    if (!challenge) {
      throw new NotFoundError('Challenge not found');
    }
    
    // Validate join conditions
    if (challenge.joinType === 'invite-code' && !inviteCode) {
      throw new ValidationError('Invite code required');
    }
    
    if (challenge.joinType === 'invite-code' && challenge.inviteCode !== inviteCode) {
      throw new ValidationError('Invalid invite code');
    }
    
    // Check if user already joined
    const existingJoin = await this.userChallengeRepository.findByUserAndChallenge(userId, challengeId);
    if (existingJoin) {
      throw new ValidationError('User already joined this challenge');
    }
    
    // Join challenge
    await this.userChallengeRepository.create({
      userId,
      challengeId,
      joinedAt: new Date()
    });
  }
}
```

## Authentication & Authorization

### Session Management

**Supabase Integration**:
```typescript
// Authentication helper
export async function getSession(request: Request): Promise<Session | null> {
  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => request.headers.get('cookie')?.split(';')
          .find(c => c.trim().startsWith(`${name}=`))?.split('=')[1],
        set: () => {}, // Handled by Supabase
        remove: () => {} // Handled by Supabase
      }
    }
  );
  
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}
```

**Route Protection**:
```typescript
export async function requireAuth(request: Request): Promise<Session> {
  const session = await getSession(request);
  if (!session) {
    throw new UnauthorizedError('Authentication required');
  }
  return session;
}
```

### Authorization Patterns

**Role-Based Access**:
```typescript
export async function requireRole(session: Session, requiredRole: string): Promise<void> {
  const userRole = await getUserRole(session.user.id);
  if (userRole !== requiredRole) {
    throw new ForbiddenError('Insufficient permissions');
  }
}

export async function requireOwnershipOrRole(
  session: Session, 
  resourceOwnerId: string, 
  requiredRole: string
): Promise<void> {
  const userRole = await getUserRole(session.user.id);
  const isOwner = session.user.id === resourceOwnerId;
  
  if (!isOwner && userRole !== requiredRole) {
    throw new ForbiddenError('Access denied');
  }
}
```

## Data Validation

### Zod Schema Patterns

**Complex Validation**:
```typescript
export const CreateChallengeSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().min(10).max(2000),
  goals: z.array(z.string().min(1).max(200)).min(1).max(10),
  startDate: z.string().datetime(),
  durationDays: z.number().int().min(1).max(365),
  joinType: z.enum(['personal', 'public', 'invite-code']),
  maxMembers: z.number().int().min(1).max(1000).default(1)
}).refine(data => {
  const startDate = new Date(data.startDate);
  const now = new Date();
  return startDate >= now;
}, {
  message: "Start date must be in the future",
  path: ["startDate"]
});
```

**Conditional Validation**:
```typescript
export const JoinChallengeSchema = z.object({
  inviteCode: z.string().optional()
}).refine(data => {
  // This will be validated in the service layer based on challenge type
  return true;
});
```

## Error Handling

### Custom Error Classes

```typescript
export class ApiError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, public details?: any) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}
```

### Global Error Handler

```typescript
export function handleError(error: unknown): Response {
  console.error('API Error:', error);
  
  if (error instanceof ApiError) {
    return json({
      error: error.message,
      code: error.code
    }, { status: error.statusCode });
  }
  
  if (error instanceof z.ZodError) {
    return json({
      error: 'Validation failed',
      details: error.errors,
      code: 'VALIDATION_ERROR'
    }, { status: 400 });
  }
  
  return json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  }, { status: 500 });
}
```

## API Client Integration

### Type-Safe API Client

**Generated Types**:
```typescript
// Auto-generated from server schemas
export interface GetUserProfileOperation {
  request: {
    params: {};
    query: {};
    body: {};
  };
  response: {
    body: {
      success: boolean;
      data: UserProfile;
    };
  };
}

export interface UpdateUserProfileOperation {
  request: {
    params: {};
    query: {};
    body: UpdateUserProfileRequest;
  };
  response: {
    body: {
      success: boolean;
      data: UserProfile;
    };
  };
}
```

**Client Implementation**:
```typescript
export class ApiClient {
  async getMyProfile(): Promise<GetUserProfileOperation['response']['body']> {
    return this.request<GetUserProfileOperation['response']['body']>(
      '/api/v1/users/me/profile', 
      { method: 'GET' }
    );
  }
  
  async updateMyProfile(dto: UpdateUserProfileOperation['request']['body']): Promise<UpdateUserProfileOperation['response']['body']> {
    return this.request<UpdateUserProfileOperation['response']['body']>(
      '/api/v1/users/me/profile', 
      { method: 'PATCH', body: JSON.stringify(dto) }
    );
  }
}
```

## Development Guidelines

### API Design
1. **Use RESTful conventions** for endpoint naming
2. **Implement proper HTTP status codes**
3. **Use Zod schemas for all validation**
4. **Provide consistent error responses**
5. **Document API endpoints clearly**

### Database Design
1. **Use Drizzle ORM for type safety**
2. **Implement proper foreign key relationships**
3. **Use appropriate indexes for performance**
4. **Follow naming conventions consistently**
5. **Implement soft deletes where appropriate**

### Service Layer
1. **Keep business logic in services**
2. **Use repositories for data access**
3. **Implement proper error handling**
4. **Add comprehensive logging**
5. **Write unit tests for business logic**

### Security
1. **Validate all input data**
2. **Implement proper authentication**
3. **Use authorization checks**
4. **Sanitize user input**
5. **Implement rate limiting**

## Testing Patterns

### Unit Testing
```typescript
describe('UserService', () => {
  let userService: UserService;
  let mockRepository: jest.Mocked<UserProfileRepository>;
  
  beforeEach(() => {
    mockRepository = createMockRepository();
    userService = new UserService(mockRepository);
  });
  
  it('should update user profile successfully', async () => {
    const userId = 'user-123';
    const updateData = { displayName: 'New Name' };
    
    mockRepository.update.mockResolvedValue(mockUserProfile);
    
    const result = await userService.updateProfile(userId, updateData);
    
    expect(mockRepository.update).toHaveBeenCalledWith(userId, updateData);
    expect(result).toEqual(mockUserProfile);
  });
});
```

### Integration Testing
```typescript
describe('User Profile API', () => {
  it('should update user profile', async () => {
    const response = await request(app)
      .patch('/api/v1/users/me/profile')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ displayName: 'New Name' })
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data.displayName).toBe('New Name');
  });
});
```

This documentation serves as a comprehensive guide for backend development in FitJourney, ensuring consistency, maintainability, and scalability across the server-side codebase.