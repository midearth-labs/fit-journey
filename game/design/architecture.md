# FitJourney Game - High-Level Architecture

## Executive Summary

The FitJourney Game is a Progressive Web Application (PWA) that combines gamified fitness education with habit tracking. The system uses pre-generated AI content to provide engaging daily challenges while maintaining low operational costs and high performance.

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FITNESS AI GAME                               │
├─────────────────────────────────────────────────────────────────────────────┤
│  Frontend (Next.js 14)  │  Backend (Supabase)  │  Content Pipeline      │
│  • PWA Support          │  • PostgreSQL DB     │  • AI Generation       │
│  • Offline Capability   │  • Real-time Auth    │  • Human Review        │
│  • Social Sharing       │  • Row Level Security│  • Static JSON Files   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Core Architecture Principles

1. **Pre-Generated Content**: All quiz questions and avatar images are generated offline using AI tools, reviewed, and stored as static JSON files
2. **Progressive Web App**: Full offline capability with service worker and local storage
3. **Real-time Updates**: Supabase real-time subscriptions for live streak and achievement updates
4. **Scalable Foundation**: Built on modern web technologies with clear separation of concerns

## High-Level System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        A[Mobile Browser] --> B[PWA App]
        C[Desktop Browser] --> B
        B --> D[Service Worker]
        B --> E[Local Storage]
    end
    
    subgraph "Frontend Layer"
        B --> F[Next.js App Router]
        F --> G[React Components]
        G --> H[State Management]
        H --> I[Zustand Store]
        H --> J[React Query]
    end
    
    subgraph "Backend Layer"
        K[Supabase] --> L[PostgreSQL]
        K --> M[Auth Service]
        K --> N[Real-time API]
        K --> O[Storage API]
    end
    
    subgraph "Content Layer"
        P[Static JSON Files] --> Q[Questions]
        P --> R[Passage Sets]
        P --> S[Daily Challenges]
        P --> T[User States]
        P --> U[Achievements]
    end
    
    subgraph "External Services"
        V[Push Notifications]
        W[Social Sharing APIs]
    end
    
    F --> K
    F --> P
    F --> V
    F --> W
```

## Data Flow Architecture

```mermaid
sequenceDiagram
    participant U as User
    participant PWA as PWA App
    participant SW as Service Worker
    participant LS as Local Storage
    participant FE as Frontend
    participant SB as Supabase
    participant DB as PostgreSQL
    participant SC as Static Content
    
    U->>PWA: Opens App
    PWA->>SW: Register Service Worker
    PWA->>FE: Load App
    FE->>SC: Load Static Content
    FE->>SB: Authenticate User
    SB->>DB: Create/Get User Record
    
    U->>FE: Start Daily Challenge
    FE->>SC: Get Challenge Questions
    FE->>LS: Cache Questions Offline
    
    loop Question Answering
        U->>FE: Answer Question
        FE->>LS: Store Progress
        FE->>SB: Sync Progress
        SB->>DB: Store QuestionAttempt
    end
    
    FE->>SB: Complete Challenge
    SB->>DB: Update Streaks & Achievements
    SB->>FE: Real-time Updates
    FE->>U: Show Results & Rewards
```

## Component Architecture

### Frontend Component Hierarchy

```
App (Layout)
├── AuthProvider
│   ├── LoginForm
│   ├── SignupForm
│   └── ProtectedRoute
├── GameProvider
│   ├── DailyChallenge
│   │   ├── QuestionRenderer
│   │   ├── PassageRenderer
│   │   └── ProgressTracker
│   ├── PracticeMode
│   │   ├── CategorySelector
│   │   └── QuestionSet
│   └── ResultsDisplay
├── ProfileProvider
│   ├── UserProfile
│   ├── AvatarDisplay
│   ├── StreakTracker
│   └── AchievementShowcase
├── HabitProvider
│   ├── HabitLogger
│   ├── StreakCalendar
│   └── ProgressCharts
└── PWAProvider
    ├── InstallPrompt
    ├── OfflineIndicator
    └── NotificationManager
```

### State Management Architecture

```mermaid
graph LR
    subgraph "Global State (Zustand)"
        A[AuthStore]
        B[GameStore]
        C[ProfileStore]
        D[HabitStore]
        E[PWAStore]
    end
    
    subgraph "Server State (React Query)"
        F[UserQueries]
        G[GameQueries]
        H[StreakQueries]
        I[AchievementQueries]
    end
    
    subgraph "Local State (React)"
        J[Form State]
        K[UI State]
        L[Animation State]
    end
    
    A --> F
    B --> G
    C --> H
    D --> I
    E --> J
```

## Database Architecture

### Core Tables Structure

```mermaid
erDiagram
    User ||--|| UserProfile : has
    User ||--o{ GameSession : creates
    User ||--o{ QuestionAttempt : makes
    User ||--o{ StreakLog : logs
    User ||--o{ StreakHistory : maintains
    User ||--o{ UserAchievement : unlocks
    User ||--o{ UserStateHistory : progresses
    
    GameSession ||--o{ QuestionAttempt : contains
    DailyChallenge ||--o{ GameSession : generates
    
    ContentCategory ||--o{ Question : categorizes
    ContentCategory ||--o{ PassageSet : categorizes
    ContentCategory ||--o{ DailyChallenge : themes
    
    PassageSet ||--o{ Question : contains
    KnowledgeBase ||--o{ Question : supports
```

### Static Content Organization

```
static-content/
├── content-categories/
│   ├── equipment.json
│   ├── form.json
│   ├── nutrition.json
│   └── injury-prevention.json
├── questions/
│   ├── equipment.json
│   ├── form.json
│   ├── nutrition.json
│   └── injury-prevention.json
├── passage-sets/
│   ├── equipment.json
│   ├── form.json
│   ├── nutrition.json
│   └── injury-prevention.json
├── daily-challenges/
│   ├── challenge-1.json
│   ├── challenge-2.json
│   └── challenge-30.json
├── user-states/
│   ├── average.json
│   ├── fit-healthy.json
│   ├── lean-tired.json
│   └── injured-recovering.json
├── achievements/
│   ├── streak-achievements.json
│   ├── knowledge-achievements.json
│   └── habit-achievements.json
└── avatar-assets/
    ├── male-teen/
    ├── female-young-adult/
    └── non-binary-middle-age/
```

## API Architecture

### RESTful Endpoints

```typescript
// Authentication
POST   /api/auth/login
POST   /api/auth/signup
POST   /api/auth/logout
GET    /api/auth/user

// Game Sessions
GET    /api/challenges/daily
POST   /api/sessions/start
POST   /api/sessions/:id/complete
POST   /api/questions/:id/attempt

// User Profile
GET    /api/profile
PUT    /api/profile
GET    /api/profile/avatar
PUT    /api/profile/avatar

// Streaks & Habits
GET    /api/streaks/current
POST   /api/habits/log
GET    /api/streaks/history

// Achievements
GET    /api/achievements
GET    /api/achievements/unlocked

// Practice Mode
GET    /api/categories
GET    /api/categories/:id/questions
```

### Real-time Subscriptions

```typescript
// Supabase Real-time Channels
const channels = {
  userProfile: `user:${userId}:profile`,
  streaks: `user:${userId}:streaks`,
  achievements: `user:${userId}:achievements`,
  gameProgress: `user:${userId}:game-progress`
};
```

## Security Architecture

### Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant SB as Supabase Auth
    participant DB as Database
    participant MW as Middleware
    
    U->>FE: Login Request
    FE->>SB: Authenticate
    SB->>FE: JWT Token
    FE->>DB: Create User Record
    FE->>MW: Set Auth Cookie
    
    Note over FE,MW: Subsequent Requests
    FE->>MW: Include Auth Header
    MW->>SB: Verify Token
    MW->>FE: Allow/Deny Access
```

### Data Protection Layers

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SECURITY LAYERS                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Row Level Security (RLS) in Supabase                                   │
│ 2. JWT Token Validation                                                   │
│ 3. Input Validation with Zod Schemas                                      │
│ 4. Rate Limiting on API Endpoints                                         │
│ 5. CORS Configuration                                                     │
│ 6. XSS Prevention via React Security                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Performance Architecture

### Caching Strategy

```mermaid
graph TB
    subgraph "Client-Side Caching"
        A[Service Worker] --> B[Static Assets]
        A --> C[Quiz Questions]
        A --> D[User Progress]
    end
    
    subgraph "Server-Side Caching"
        E[Next.js ISR] --> F[Static Pages]
        E --> G[API Responses]
    end
    
    subgraph "Database Caching"
        H[Supabase] --> I[Query Results]
        H --> J[Connection Pooling]
    end
    
    subgraph "CDN Caching"
        K[Vercel Edge] --> L[Global Assets]
        K --> M[Avatar Images]
    end
```

### Offline-First Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              OFFLINE STRATEGY                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Service Worker caches all static content                               │
│ 2. Local Storage stores user progress                                     │
│ 3. IndexedDB for larger offline datasets                                  │
│ 4. Background sync when connection restored                                │
│ 5. Conflict resolution for offline changes                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Deployment Architecture

### Infrastructure Components

```mermaid
graph TB
    subgraph "Frontend Hosting"
        A[Vercel] --> B[Next.js App]
        A --> C[Static Assets]
        A --> D[Edge Functions]
    end
    
    subgraph "Backend Services"
        E[Supabase] --> F[PostgreSQL]
        E --> G[Auth Service]
        E --> H[Storage]
        E --> I[Real-time API]
    end
    
    subgraph "External Services"
        J[Push Notifications]
        K[Social Sharing]
        L[Analytics]
    end
    
    B --> E
    B --> J
    B --> K
    B --> L
```

### CI/CD Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CI/CD PIPELINE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. GitHub Actions for automated testing                                    │
│ 2. Drizzle Kit for database migrations                                     │
│ 3. Vercel for automatic deployments                                        │
│ 4. Supabase for database schema updates                                    │
│ 5. Content validation before deployment                                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Content Generation Pipeline

### AI Content Workflow

```mermaid
graph LR
    A[Content Requirements] --> B[AI Generation]
    B --> C[Structured JSON]
    C --> D[AI Review]
    D --> E[Human Validation]
    E --> F[Content Approval]
    F --> G[Static File Creation]
    G --> H[Database Import]
    H --> I[Live Deployment]
```

### Content Validation Rules

```typescript
// Content validation schemas
const questionSchema = z.object({
  id: z.string().uuid(),
  content_category_id: z.string(),
  question_text: z.string().min(10),
  options: z.array(z.string()).min(2).max(4),
  correct_answer_index: z.number().min(0).max(3),
  explanation: z.string().min(20),
  difficulty_level: z.number().min(1).max(5),
  is_standalone: z.boolean(),
  passage_set_id: z.string().uuid().optional()
});

const dailyChallengeSchema = z.object({
  id: z.string().uuid(),
  day: z.number().min(1),
  content_category_id: z.string(),
  challenge_structure: z.array(z.object({
    type: z.enum(['standalone', 'passage']),
    question_id: z.string().uuid().optional(),
    passage_set_id: z.string().uuid().optional(),
    question_ids: z.array(z.string().uuid()).optional()
  })),
  total_questions: z.number().min(1),
  theme: z.string().optional()
});
```

## Monitoring & Analytics

### Key Metrics

```typescript
// User Engagement Metrics
const metrics = {
  dailyActiveUsers: 'DAU tracking',
  challengeCompletionRate: 'Daily challenge success rate',
  streakRetention: 'User streak continuation',
  habitAdoption: 'Habit logging frequency',
  socialSharing: 'Challenge sharing rate',
  offlineUsage: 'PWA offline engagement'
};

// Performance Metrics
const performance = {
  pageLoadTime: 'Core Web Vitals',
  offlineAvailability: 'Service worker effectiveness',
  databaseResponseTime: 'Supabase performance',
  cacheHitRate: 'Static content caching',
  errorRate: 'System reliability'
};
```

### Error Handling Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ERROR HANDLING                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Global Error Boundary for React errors                                 │
│ 2. API error handling with user-friendly messages                         │
│ 3. Offline error handling with retry mechanisms                           │
│ 4. Database error logging and monitoring                                  │
│ 5. Graceful degradation for missing content                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Scalability Considerations

### Horizontal Scaling

```mermaid
graph TB
    subgraph "Current Architecture"
        A[Single Vercel Instance]
        B[Single Supabase Instance]
    end
    
    subgraph "Future Scaling"
        C[Multiple Vercel Regions]
        D[Supabase Read Replicas]
        E[CDN Edge Locations]
        F[Database Sharding]
    end
    
    A --> C
    B --> D
    C --> E
    D --> F
```

### Performance Optimization

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PERFORMANCE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Image optimization with Next.js Image component                        │
│ 2. Code splitting and lazy loading                                        │
│ 3. Database query optimization                                            │
│ 4. Service worker caching strategies                                      │
│ 5. Edge computing for global performance                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Risk Mitigation

### Technical Risks

1. **Content Generation Quality**: Implement multi-stage review process
2. **Offline Sync Conflicts**: Use timestamp-based conflict resolution
3. **Database Performance**: Monitor and optimize queries, implement caching
4. **PWA Compatibility**: Progressive enhancement and fallback strategies

### Business Risks

1. **User Engagement**: Gamification mechanics and social features
2. **Content Freshness**: Regular content updates and seasonal themes
3. **Platform Dependencies**: Vendor lock-in mitigation strategies
4. **Scalability Costs**: Monitor usage and implement cost controls

## Success Metrics

### Technical KPIs

- **Performance**: Page load time < 2 seconds, offline functionality > 95%
- **Reliability**: 99.9% uptime, error rate < 0.1%
- **Scalability**: Support 10K+ concurrent users without degradation

### Business KPIs

- **User Engagement**: Daily active users, challenge completion rate
- **Retention**: 7-day, 30-day, and 90-day retention rates
- **Growth**: User acquisition, social sharing, viral coefficient

## Implementation Roadmap

### Phase 1: Core Foundation (Weeks 1-4)
- [ ] Database schema implementation
- [ ] Authentication system
- [ ] Basic UI components
- [ ] Static content generation

### Phase 2: Game Mechanics (Weeks 5-8)
- [ ] Daily challenge system
- [ ] Question rendering engine
- [ ] Streak tracking
- [ ] Achievement system

### Phase 3: PWA Features (Weeks 9-12)
- [ ] Service worker implementation
- [ ] Offline functionality
- [ ] Push notifications
- [ ] Social sharing

### Phase 4: Polish & Launch (Weeks 13-16)
- [ ] Performance optimization
- [ ] User testing
- [ ] Content refinement
- [ ] Production deployment

This architecture provides a solid foundation for building a scalable, engaging fitness game that meets all the specified requirements while maintaining performance and cost efficiency.
