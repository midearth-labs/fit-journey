# FitJourney - Product Features & Functionality

## Overview
FitJourney is a gamified fitness education platform that combines structured learning content with wellness metrics tracking to create a comprehensive 70-day fitness journey. The platform uses avatar progression, and challenges to motivate users through their fitness education.

## Core Features

### 1. User Authentication & Profile Management
**API Operations:** `getMyProfile()`, `updateMyProfile()`

- **Email/Password Authentication** - Standard email and password registration and login
- **OAuth Integration** - Google OAuth provider support for seamless sign-in
- **Password Reset** - Password recovery functionality via email
- **User Profile Management** - Comprehensive but optional profile system including:
  - Display name customization
  - Avatar gender and age range selection
  - Personalization country codes for localized content
  - Timezone configuration
  - Preferred reminder time settings
  - Notification preferences management
The user is not required to supply any profile information to use the app features, the data are enhancements for the user experience and are all opt-in.

**Dependencies:** All authenticated features depend on this system

### 2. Content Management System
**API Operations:** `listChallenges()`, `getChallengeById()`

- **Knowledge Base Articles** - 70+ structured fitness education articles across 9 categories:
  - Fitness Foundation & Getting Started
  - Exercise Fundamentals & Form
  - Equipment & Gym Basics
  - Nutrition Essentials
  - Exercise Types & Goal Setting
  - Body Mechanics & Movement
  - Recovery & Injury Prevention
  - Mindset & Motivation
  - Health & Lifestyle Integration
 Every article has a call-to-action:

**Dependencies:** Articles feed into quiz system and progress tracking

### 3. Challenge System
**API Operations:** `createUserChallenge()`, `listUserChallenges()`, `getUserChallenge()`, `updateUserChallengeSchedule(), cancelUserChallenge`

- **Structured Challenges** - Pre-defined challenge templates (7-day challenges, 30-day, 40-day challenges)
- **Challenge Creation** - Users can start challenges with custom start dates
- **Challenge Cancellation** - Users can cancel/deactivate challenges at any time.
- **Challenge Management** - Schedule modification and progress tracking
- **Challenge Status Tracking** - Not started, active, completed, locked, inactive states
- **Knowledge Base Integration** - Challenges link to specific articles and learning content

**Dependencies:** Integrates with progress tracking

### 4. Progress Tracking & Analytics
**API Operations:** `listLogs()`, `putLog()`

- **Daily Metric Logging** - Track core wellness metrics e.g.
  - Daily Movement (15+ minutes of physical activity)
  - Clean Eating (nutritious food choices)
  - Sleep Quality (7-9 hours of restorative sleep)
  - Hydration (adequate water intake)
The user is not prompted to log all metrics at a time. The metrics the user is prompted to log is related to the challenge(s) they are actively participating in. For example, a 7-day nutrition challenge will only require clean eating metric to be logged.

- **Progress Visualization** - Real-time progress tracking with:
  - Overall completion percentages
  - Article completion tracking
  - Quiz score accumulation

- **Data Persistence** - Both client-side (localStorage) and server-side storage

**Dependencies:** Feeds into avatar progression

### 5. Knowledge Check (quiz) System
**API Operations:** `listUserChallengeQuizSubmissions()`, `submitUserChallengeQuiz()`

- **Knowledge Assessment** - Quiz questions tied to specific articles and knowledge bases
- **Question Types** - Standalone and passage-based questions
- **Answer Tracking** - Detailed answer logging with correctness and hint usage
- **Retry Mechanism** - Multiple attempts allowed with override submission option
- **Progress Integration** - Quiz completion contributes to overall challenge progress

**Dependencies:** Requires article completion and integrates with avatar progression

### 7. Avatar Progression System

- **Avatar Customization** - Gender and age range selection in user profile
- **Progression Mechanics** - Avatar advancement based on:
  - Article completion
  - Quiz performance
  - Metric logging
  - Challenge completion

**Dependencies:** Requires progress tracking and daily metric logging management

## Secondary Features

### 8. Social Features
These features are meant to be introduced for a user that has sufficiently engaged with the system and built confidence. 
- **User Invites** - Invite system with user codes for friend referrals
- **Progress Sharing** - Social sharing of personal progress and fitness avatar, CTA includes "friend invites". Viewers can react on social sharing using pre-defined simple emoji reactions (👏 💪 🎉). 
- **Group FitJourney** - Collaborative challenges and group progress tracking
- **Discord Community** - External community integration for user engagement

### 8.1 Knowledge Q&A Community
Article-Specific Discussions: Each article has a simple but context-specific Q&A section
Beginner-Safe Environment: Clear labeling: "No question is too basic here!"
Expert Community Helpers: Advanced users earn badges for helping newcomers
Moderated Environment: AI + human moderation to prevent intimidation

Benefits:

**Dependencies:** Requires user authentication and progress tracking

### 9. Calendar Integration

- **Add to Calendar** - Static iCal generation or server-backed calendar integration
- **Reminder System** - Automated reminders based on user preferences
- **Schedule Management** - Integration with user's preferred reminder times

**Dependencies:** Requires user profile preferences and challenge scheduling

### 10. Personal Dashboard & Analytics

- **Trend Analysis** - Historical progress visualization and trend identification
- **Performance Analytics** - Detailed analytics on learning progress and habit formation
- **Goal Tracking** - Personal goal setting and achievement tracking
- **Insights & Recommendations** - AI-driven insights based on user behavior

**Dependencies:** Requires comprehensive progress tracking data

### 11. Content Consumption Modes
- **60-Second Fitness IQ Test** - Fun entry point that provides personalized article recommendations for nun-authenticated access and challenges for authenticated learning.
- **Non-Authenticated Access** -  Public/Guest article consumption without FitJourney participation
- **Authenticated Learning** - Registered users Full-featured learning with progress tracking and quiz integration
- **Progressive Profile Updates** - Contextual profile enhancement prompts at strategic touchpoints

**Dependencies:** Requires content management system and user authentication

### 12. Practical Tips & Call-to-Action
- **Daily Tips** - 1-minute daily content (Text, video, or link-based) practical tips delivered daily
- **Action Items** - Contextual and easily do-able calls-to-action based on user progress
- **Personalized Recommendations** - Tailored suggestions based on user behavior and preferences

**Dependencies:** Requires content system and user progress data

## Technical Architecture

### API Structure
- **RESTful API** - Clean API design with proper HTTP methods
- **Authentication** - Supabase-based authentication with session management
- **Data Validation** - Zod schema validation for all API endpoints
- **Error Handling** - Comprehensive error handling with proper HTTP status codes

### Data Storage
- **Database** - PostgreSQL with Drizzle ORM
- **File Storage** - Static content served from `/static/content/`
- **Caching** - Client-side caching for content service
- **Session Management** - Server-side session handling

### Frontend Architecture
- **SvelteKit** - Modern web framework with SSR capabilities
- **Responsive Design** - Mobile-first responsive design
- **Progressive Enhancement** - Works without JavaScript for core functionality
- **State Management** - Svelte stores for client-side state management

## Feature Dependencies

### Core Dependencies
1. **Authentication System** → All user-specific features
2. **Content Management** → Quiz system, progress tracking, challenges
3. **Progress Tracking** → Avatar progression, analytics
4. **Challenge System** → Progress tracking

### Secondary Dependencies
3. **User Profile** → Calendar integration, personalized recommendations
4. **Progress Data** → Analytics dashboard, social sharing

### Integration Points
- **Content → Quiz** - Articles generate quiz questions
- **Quiz → Progress** - Quiz completion updates progress tracking
- **Progress → Avatar** - Daily logging drive avatar progression
- **Challenges → All** - Challenges orchestrate the entire user journey

## Implementation Status Summary

**✅ Core (6 features):**
- User Authentication & Profile Management
- Content Management System
- Challenge System
- Progress Tracking & Analytics
- Quiz & Assessment System
- Basic Avatar Progression

**📋 Secondary (5 features):**
- Social Features
- Calendar Integration
- Personal Dashboard & Analytics
- Content Consumption Modes
- Practical Tips & Call-to-Action
- Avatar Progression System (basic structure exists, full gamification pending)

The platform provides a solid foundation for gamified fitness education with comprehensive tracking and progression systems, ready for expansion into social and advanced analytics features.
