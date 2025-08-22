# FitJourney Game - Visual Architecture Diagrams

## System Overview Diagram

```mermaid
graph TB
    subgraph "User Experience Layer"
        A[Mobile User] --> B[PWA App]
        C[Desktop User] --> B
        D[Tablet User] --> B
    end
    
    subgraph "Frontend Application"
        B --> E[Next.js 14 App]
        E --> F[React Components]
        E --> G[Service Worker]
        E --> H[Local Storage]
    end
    
    subgraph "Backend Services"
        I[Supabase Platform]
        I --> J[PostgreSQL Database]
        I --> K[Authentication Service]
        I --> L[Real-time API]
        I --> M[Storage Service]
    end
    
    subgraph "Content Management"
        N[Static JSON Files]
        N --> O[Questions]
        N --> P[Daily Challenges]
        N --> Q[User States]
        N --> R[Achievements]
    end
    
    subgraph "External Integrations"
        S[Push Notifications]
        T[Social Sharing]
        U[Analytics]
    end
    
    F --> I
    F --> N
    F --> S
    F --> T
    F --> U
```

## User Journey Flow

```mermaid
journey
    title FitJourney Game User Journey
    section Onboarding
      User visits app: 5: User
      User signs up: 4: User
      User completes profile: 3: User
      User sees first challenge: 5: User
    section Daily Engagement
      User starts daily challenge: 4: User
      User answers questions: 3: User
      User completes challenge: 5: User
      User logs habits: 4: User
      User checks streaks: 3: User
    section Achievement & Growth
      User unlocks achievement: 5: User
      User shares results: 4: User
      User practices more: 3: User
      User progresses avatar: 5: User
```

## Component Hierarchy & Data Flow

```mermaid
graph TD
    subgraph "App Root"
        A[Layout Component]
        A --> B[AuthProvider]
        A --> C[GameProvider]
        A --> D[ProfileProvider]
        A --> E[HabitProvider]
        A --> F[PWAProvider]
    end
    
    subgraph "Authentication Flow"
        B --> G[LoginForm]
        B --> H[SignupForm]
        B --> I[ProtectedRoute]
    end
    
    subgraph "Game Engine"
        C --> J[DailyChallenge]
        C --> K[PracticeMode]
        C --> L[QuestionRenderer]
        C --> M[PassageRenderer]
        C --> N[ProgressTracker]
    end
    
    subgraph "User Profile"
        D --> O[UserProfile]
        D --> P[AvatarDisplay]
        D --> Q[StreakTracker]
        D --> R[AchievementShowcase]
    end
    
    subgraph "Habit Tracking"
        E --> S[HabitLogger]
        E --> T[StreakCalendar]
        E --> U[ProgressCharts]
    end
    
    subgraph "PWA Features"
        F --> V[InstallPrompt]
        F --> W[OfflineIndicator]
        F --> X[NotificationManager]
    end
    
    subgraph "State Management"
        Y[Zustand Stores]
        Z[React Query]
        AA[Local Storage]
    end
    
    J --> Y
    K --> Y
    O --> Y
    S --> Y
    Y --> Z
    Y --> AA
```

## Database Schema Visualization

```mermaid
erDiagram
    users {
        uuid id PK
        string email UK
        string display_name
        string avatar_gender
        string avatar_age_range
        string timezone
        string preferred_reminder_time
        jsonb notification_preferences
        timestamp created_at
        timestamp updated_at
    }
    
    user_profiles {
        uuid id PK
        uuid user_id FK
        string current_state
        jsonb current_streak_ids
        jsonb longest_streaks
        date last_activity_date
        timestamp created_at
        timestamp updated_at
    }
    
    game_sessions {
        uuid id PK
        uuid user_id FK
        string challenge_id
        timestamp started_at
        timestamp completed_at
        boolean is_completed
        integer total_questions
        integer correct_answers
        integer time_spent_seconds
        integer attempt_count
    }
    
    question_attempts {
        uuid id PK
        uuid game_session_id FK
        string question_id
        integer selected_answer_index
        boolean is_correct
        integer time_spent_seconds
        timestamp answered_at
        boolean hint_used
    }
    
    streak_logs {
        uuid id PK
        uuid user_id FK
        date date
        jsonb entries
        timestamp logged_at
    }
    
    streak_history {
        uuid id PK
        uuid user_id FK
        integer streak_length
        date started_date
        date ended_date
        string streak_type
        timestamp created_at
    }
    
    user_achievements {
        uuid id PK
        uuid user_id FK
        string achievement_id
        timestamp unlocked_at
    }
    
    user_state_history {
        uuid id PK
        uuid user_id FK
        string state_id
        timestamp unlocked_at
    }
    
    users ||--|| user_profiles : has
    users ||--o{ game_sessions : creates
    users ||--o{ question_attempts : makes
    users ||--o{ streak_logs : logs
    users ||--o{ streak_history : maintains
    users ||--o{ user_achievements : unlocks
    users ||--o{ user_state_history : progresses
    
    game_sessions ||--o{ question_attempts : contains
    user_profiles }o--|| users : belongs_to
```

## API Endpoint Architecture

```mermaid
graph LR
    subgraph "Client Layer"
        A[React Components]
        B[Service Worker]
        C[Local Storage]
    end
    
    subgraph "API Routes"
        D[/api/auth/*]
        E[/api/sessions/*]
        F[/api/profile/*]
        G[/api/streaks/*]
        H[/api/achievements/*]
        I[/api/habits/*]
        J[/api/challenges/*]
    end
    
    subgraph "Database Layer"
        K[Supabase]
        L[PostgreSQL]
        M[Row Level Security]
    end
    
    subgraph "Static Content"
        N[Questions JSON]
        O[Challenges JSON]
        P[States JSON]
        Q[Achievements JSON]
    end
    
    A --> D
    A --> E
    A --> F
    A --> G
    A --> H
    A --> I
    A --> J
    
    D --> K
    E --> K
    F --> K
    G --> K
    H --> K
    I --> K
    J --> N
    J --> O
    J --> P
    J --> Q
    
    K --> L
    L --> M
```

## State Management Flow

```mermaid
graph TD
    subgraph "User Actions"
        A[User Login]
        B[Start Challenge]
        C[Answer Question]
        D[Complete Challenge]
        E[Log Habit]
        F[Check Profile]
    end
    
    subgraph "State Updates"
        G[Auth Store]
        H[Game Store]
        I[Profile Store]
        J[Habit Store]
        K[PWA Store]
    end
    
    subgraph "Server Sync"
        L[React Query]
        M[Supabase]
        N[Database]
    end
    
    subgraph "Local Persistence"
        O[Local Storage]
        P[IndexedDB]
        Q[Service Worker Cache]
    end
    
    A --> G
    B --> H
    C --> H
    D --> H
    D --> I
    E --> J
    F --> I
    
    G --> L
    H --> L
    I --> L
    J --> L
    
    L --> M
    M --> N
    
    G --> O
    H --> P
    I --> O
    J --> O
    K --> Q
```

## Offline-First Architecture

```mermaid
graph TB
    subgraph "Online State"
        A[User Online]
        A --> B[Real-time Updates]
        A --> C[Server Sync]
        A --> D[Push Notifications]
    end
    
    subgraph "Offline State"
        E[User Offline]
        E --> F[Local Storage]
        E --> G[Service Worker Cache]
        E --> H[Offline Queue]
    end
    
    subgraph "Sync Process"
        I[Connection Restored]
        I --> J[Background Sync]
        I --> K[Conflict Resolution]
        I --> L[Data Merge]
    end
    
    subgraph "Caching Strategy"
        M[Static Content]
        N[User Progress]
        O[Avatar Assets]
        P[Question Images]
    end
    
    A --> M
    A --> N
    A --> O
    A --> P
    
    E --> M
    E --> N
    E --> O
    E --> P
    
    I --> J
    J --> K
    K --> L
    L --> C
```

## Content Generation Pipeline

```mermaid
graph LR
    subgraph "Content Planning"
        A[Content Requirements]
        B[Category Definition]
        C[Difficulty Distribution]
        D[Theme Planning]
    end
    
    subgraph "AI Generation"
        E[OpenAI GPT-4]
        F[Structured Prompts]
        G[JSON Output]
        H[Content Validation]
    end
    
    subgraph "Human Review"
        I[Expert Review]
        J[Accuracy Check]
        K[Difficulty Calibration]
        L[Content Approval]
    end
    
    subgraph "Content Deployment"
        M[Static JSON Files]
        N[Git Repository]
        O[Build Process]
        P[Live Application]
    end
    
    A --> E
    B --> F
    C --> F
    D --> F
    
    E --> G
    F --> G
    G --> H
    
    H --> I
    I --> J
    J --> K
    K --> L
    
    L --> M
    M --> N
    N --> O
    O --> P
```

## Performance Optimization Strategy

```mermaid
graph TD
    subgraph "Frontend Optimization"
        A[Code Splitting]
        B[Lazy Loading]
        C[Image Optimization]
        D[Bundle Analysis]
    end
    
    subgraph "Caching Layers"
        E[Service Worker]
        F[Local Storage]
        G[CDN Cache]
        H[Database Cache]
    end
    
    subgraph "Data Optimization"
        I[Pagination]
        J[Virtual Scrolling]
        K[Debounced Input]
        L[Optimistic Updates]
    end
    
    subgraph "Network Optimization"
        M[HTTP/2]
        N[Gzip Compression]
        O[Resource Hints]
        P[Preloading]
    end
    
    A --> E
    B --> F
    C --> G
    D --> H
    
    I --> M
    J --> N
    K --> O
    L --> P
```

## Security Architecture

```mermaid
graph TB
    subgraph "Authentication Layer"
        A[JWT Tokens]
        B[Supabase Auth]
        C[Session Management]
        D[Password Policies]
    end
    
    subgraph "Data Protection"
        E[Row Level Security]
        F[Input Validation]
        G[SQL Injection Prevention]
        H[XSS Protection]
    end
    
    subgraph "API Security"
        I[Rate Limiting]
        J[CORS Configuration]
        K[Request Validation]
        L[Error Handling]
    end
    
    subgraph "Infrastructure Security"
        M[HTTPS Only]
        N[Security Headers]
        O[Content Security Policy]
        P[Regular Updates]
    end
    
    A --> E
    B --> F
    C --> G
    D --> H
    
    E --> I
    F --> J
    G --> K
    H --> L
    
    I --> M
    J --> N
    K --> O
    L --> P
```

## Deployment & CI/CD Pipeline

```mermaid
graph LR
    subgraph "Development"
        A[Local Development]
        B[Feature Branches]
        C[Code Review]
        D[Testing]
    end
    
    subgraph "CI/CD Pipeline"
        E[GitHub Actions]
        F[Automated Tests]
        G[Build Process]
        H[Deployment]
    end
    
    subgraph "Staging"
        I[Preview Deployments]
        J[Integration Testing]
        K[User Acceptance]
        L[Performance Testing]
    end
    
    subgraph "Production"
        M[Vercel Deployment]
        N[Database Migrations]
        O[Content Updates]
        P[Monitoring]
    end
    
    A --> B
    B --> C
    C --> D
    D --> E
    
    E --> F
    F --> G
    G --> H
    
    H --> I
    I --> J
    J --> K
    K --> L
    
    L --> M
    M --> N
    N --> O
    O --> P
```

## Monitoring & Analytics

```mermaid
graph TD
    subgraph "User Metrics"
        A[Daily Active Users]
        B[Challenge Completion Rate]
        C[Streak Retention]
        D[Social Sharing Rate]
    end
    
    subgraph "Performance Metrics"
        E[Page Load Time]
        F[Time to Interactive]
        G[Core Web Vitals]
        H[Offline Usage]
    end
    
    subgraph "Business Metrics"
        I[User Acquisition]
        J[Engagement Score]
        K[Content Effectiveness]
        L[Feature Adoption]
    end
    
    subgraph "Technical Metrics"
        M[Error Rate]
        N[API Response Time]
        O[Database Performance]
        P[Cache Hit Rate]
    end
    
    A --> Q[Analytics Dashboard]
    B --> Q
    C --> Q
    D --> Q
    
    E --> R[Performance Monitoring]
    F --> R
    G --> R
    H --> R
    
    I --> S[Business Intelligence]
    J --> S
    K --> S
    L --> S
    
    M --> T[Error Tracking]
    N --> T
    O --> T
    P --> T
```

## Scalability Roadmap

```mermaid
graph TD
    subgraph "Phase 1: MVP"
        A[Single Region]
        B[Basic PWA]
        C[Core Features]
        D[Static Content]
    end
    
    subgraph "Phase 2: Growth"
        E[Multiple Regions]
        F[Advanced PWA]
        G[Social Features]
        H[Dynamic Content]
    end
    
    subgraph "Phase 3: Scale"
        I[Global CDN]
        J[Microservices]
        K[Advanced Analytics]
        L[AI Personalization]
    end
    
    subgraph "Phase 4: Enterprise"
        M[Multi-tenancy]
        N[Advanced Security]
        O[Custom Integrations]
        P[White-label Solutions]
    end
    
    A --> E
    B --> F
    C --> G
    D --> H
    
    E --> I
    F --> J
    G --> K
    H --> L
    
    I --> M
    J --> N
    K --> O
    L --> P
```

These visual diagrams provide a comprehensive understanding of the FitJourney Game architecture, showing how all components interact, how data flows through the system, and how the application scales from MVP to enterprise levels. Each diagram focuses on a specific aspect of the system, making it easier to understand the complex relationships and dependencies.
