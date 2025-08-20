# Phase 1 - Structured Requirements

## R1: Database Schema & Content Management

### R1.1: Database Structure
**Dependencies**: None
```
WHEN the application initializes
THE SYSTEM SHALL create all required database tables matching the entity models (User, UserProfile, GameType, Question, PassageSet, AvatarAsset, DailyChallenge, GameSession, QuestionAttempt, StreakLog, StreakHistory, Achievement, UserAchievement, NotificationQueue)
```

### R1.2: Content Seeding
**Dependencies**: R1.1
```
WHEN the database is initialized
THE SYSTEM SHALL seed GameType data with all supported game categories (Equipment Identification, Form Check, Nutrition Myths vs Facts, Injury Prevention, Body Mechanics, Foundational Movements, Exercise Identification)
```

```
WHEN the database is initialized
THE SYSTEM SHALL seed Achievement data with Phase 1 achievements (7-day streak, 14-day streak, first quiz completion, 50 questions answered, clean eating for 3 days, workout logging for 7 days)
```

```
WHEN the database is initialized
THE SYSTEM SHALL seed AvatarAsset data with basic avatar combinations (young-male/female, old-male/female each with states: fit-healthy, lean-tired, injured-recovering)
```

### R1.3: Question Import System
**Dependencies**: R1.1, R1.2
```
WHEN pre-generated standalone questions are ready for import
THE SYSTEM SHALL provide a bulk import mechanism for Question entities with validation for required fields (question_text, options array with 2-4 items, correct_answer_index, explanation, game_type_id, difficulty_level, is_standalone: true, passage_set_id: null)
```

```
WHEN pre-generated passage sets are ready for import
THE SYSTEM SHALL provide a bulk import mechanism for PassageSet entities and associated Question entities with is_standalone: false and proper passage_set_id references
```

```
WHEN importing passage-based questions
THE SYSTEM SHALL validate that each question references a valid PassageSet and that the PassageSet.question_count matches the number of associated questions
```

## R2: User Profile Management

### R2.1: Profile Creation
**Dependencies**: R1.1 (Authentication assumed in place)
```
WHEN a new user completes authentication
THE SYSTEM SHALL create a UserProfile with default values (avatar_category based on user selection, avatar_state "fit-healthy", total_coins 0, current_streak 0, longest_streak 0)
```

### R2.2: Avatar Selection
**Dependencies**: R2.1, R1.2
```
WHEN a new user accesses profile setup
THE SYSTEM SHALL display available avatar categories (young-male, young-female, old-male, old-female) for selection
```

```
WHEN a user selects an avatar category
THE SYSTEM SHALL update their UserProfile.avatar_category and display the corresponding avatar image
```

### R2.3: Avatar Progression
**Dependencies**: R2.1, R1.2
```
WHEN a user's current_streak reaches a milestone (7, 14, 21, 30 days)
THE SYSTEM SHALL automatically update their avatar_state to reflect improved fitness level
```

```
WHEN a user answers form-related questions incorrectly (>50% wrong in a session)
THE SYSTEM SHALL temporarily set avatar_state to "injured-recovering" for 24 hours
```

## R3: Daily Challenge System

### R3.1: Challenge Generation
**Dependencies**: R1.1, R1.2, R1.3
```
WHEN the system runs daily at midnight UTC
THE SYSTEM SHALL generate a DailyChallenge for the current date with 10 questions total, selecting a mix of standalone questions and passage-based question groups, ensuring difficulty distribution (3 easy, 4 medium, 3 hard) across all questions
```

```
WHEN generating a daily challenge structure
THE SYSTEM SHALL create a challenge_structure array that defines the sequence of questions, supporting patterns like: standalone question, passage set (2-5 questions), standalone question, another passage set, etc.
```

```
WHEN selecting passage sets for daily challenges
THE SYSTEM SHALL ensure that each selected PassageSet contributes 2-5 questions to maintain the total of 10 questions per challenge
```

```
WHEN generating a daily challenge
THE SYSTEM SHALL ensure no question (standalone or passage-based) is repeated within a 7-day window for any user
```

```
WHEN generating a daily challenge
THE SYSTEM SHALL ensure no PassageSet is repeated within a 14-day window for any user
```

### R3.2: Challenge Access
**Dependencies**: R3.1
```
WHEN a user accesses the app
THE SYSTEM SHALL display the current day's challenge prominently on the home screen
```

```
WHEN a user has completed the daily challenge
THE SYSTEM SHALL show completion status and next day's challenge availability
```

### R3.3: Challenge Completion
**Dependencies**: R3.1, R3.2
```
WHEN a user starts a daily challenge
THE SYSTEM SHALL create a GameSession record and present questions according to the challenge_structure sequence
```

```
WHEN a user encounters a passage-based question section
THE SYSTEM SHALL display the passage text prominently and allow the user to reference it while answering all associated questions
```

```
WHEN a user answers a question in a daily challenge
THE SYSTEM SHALL record a QuestionAttempt with selected answer, correctness, timestamp
```

```
WHEN a user completes all questions in a daily challenge
THE SYSTEM SHALL mark the GameSession as completed, calculate coins earned (base 10 + 2 per correct answer), and update UserProfile.total_coins
```

## R4: Individual Game Sessions

### R4.1: Game Type Selection
**Dependencies**: R1.2, R1.3
```
WHEN a user accesses the games section
THE SYSTEM SHALL display all available GameType options with icons, descriptions, and question counts
```

```
WHEN a user selects a specific game type
THE SYSTEM SHALL start a practice session with 5 random questions from that category
```

### R4.2: Practice Session Flow
**Dependencies**: R4.1
```
WHEN a user starts a practice session
THE SYSTEM SHALL create a GameSession record with session_type "practice" and select 5 questions (mix of standalone and passage-based as available)
```

```
WHEN a practice session includes passage-based questions
THE SYSTEM SHALL present the passage text and allow the user to answer all associated questions from that passage before moving to the next section
```

```
WHEN a user answers a question in practice mode
THE SYSTEM SHALL immediately show the correct answer and explanation before proceeding to the next question
```

```
WHEN a user completes a practice session
THE SYSTEM SHALL show performance summary (X/5 correct, time taken, coins earned: 1 per correct answer)
```

## R5: Streak Management

### R5.1: Streak Tracking
**Dependencies**: R3.3, R4.2
```
WHEN a user completes their first daily challenge
THE SYSTEM SHALL set UserProfile.current_streak to 1 and create a StreakHistory record with is_current true
```

```
WHEN a user completes a daily challenge on consecutive days
THE SYSTEM SHALL increment UserProfile.current_streak by 1
```

```
WHEN a user misses a daily challenge (no completion by 11:59 PM in their timezone)
THE SYSTEM SHALL reset UserProfile.current_streak to 0, set current StreakHistory.is_current to false with ended_date, and create a new StreakHistory record if they resume
```

### R5.2: Streak Milestones
**Dependencies**: R5.1
```
WHEN a user's current_streak reaches a milestone value (7, 14, 30 days)
THE SYSTEM SHALL check for and award corresponding achievements
```

```
WHEN a user's current_streak exceeds their longest_streak
THE SYSTEM SHALL update UserProfile.longest_streak to the current value
```

## R6: Habit Logging

### R6.1: Daily Habit Interface
**Dependencies**: R1.1
```
WHEN a user accesses the daily habits section
THE SYSTEM SHALL display toggle buttons for "Workout Completed" and "Ate Clean Today" with current day's status
```

```
WHEN a user toggles a habit status
THE SYSTEM SHALL update or create today's StreakLog record with the new values
```

### R6.2: Habit Rewards
**Dependencies**: R6.1
```
WHEN a user logs both workout_completed and ate_clean as true for the same day
THE SYSTEM SHALL award 3 bonus coins and update UserProfile.total_coins
```

```
WHEN a user maintains both habits for 7 consecutive days
THE SYSTEM SHALL check for and award the "Consistent Habits" achievement
```

## R7: Achievement System

### R7.1: Achievement Checking
**Dependencies**: R1.2, R5.2, R6.2
```
WHEN any user action updates streaks, coins, or completion counts
THE SYSTEM SHALL check all applicable achievements for unlock conditions
```

```
WHEN an achievement unlock condition is met
THE SYSTEM SHALL create a UserAchievement record and award any associated coin rewards
```

### R7.2: Achievement Display
**Dependencies**: R7.1
```
WHEN a user unlocks an achievement
THE SYSTEM SHALL display a celebration modal with achievement details and rewards
```

```
WHEN a user accesses their profile
THE SYSTEM SHALL display all unlocked achievements with unlock dates
```

## R8: PWA Features

### R8.1: Installation
**Dependencies**: None
```
WHEN a user visits the app on a supported mobile browser
THE SYSTEM SHALL display an "Add to Home Screen" prompt after 2 minutes of engagement
```

```
WHEN a user installs the PWA
THE SYSTEM SHALL register a service worker for offline functionality
```

### R8.2: Offline Capability
**Dependencies**: R8.1
```
WHEN the PWA is installed and the user goes offline
THE SYSTEM SHALL allow viewing of previously loaded questions and avatar status
```

```
WHEN the user comes back online after answering questions offline
THE SYSTEM SHALL sync all QuestionAttempt and progress data to the server
```

## R9: Basic Notifications

### R9.1: Notification Opt-in
**Dependencies**: R8.1
```
WHEN a user installs the PWA
THE SYSTEM SHALL request permission for push notifications with clear benefit explanation
```

```
WHEN a user grants notification permission
THE SYSTEM SHALL update their UserProfile.notification_preferences
```

### R9.2: Daily Reminders
**Dependencies**: R9.1
```
WHEN a user has not completed their daily challenge by 7 PM in their timezone
THE SYSTEM SHALL send a push notification "Your daily fitness knowledge challenge is waiting!"
```

```
WHEN a user has a streak of 3+ days and hasn't completed today's challenge by 9 PM
THE SYSTEM SHALL send a push notification "Don't break your X-day streak!"
```

## R10: Social Sharing

### R10.1: Result Sharing
**Dependencies**: R3.3, R4.2
```
WHEN a user completes any game session
THE SYSTEM SHALL display a "Share Result" button with pre-formatted text "I scored X/10 on today's fitness knowledge challenge - can you beat me?"
```

```
WHEN a user clicks share
THE SYSTEM SHALL generate a unique challenge URL that links to the same questions they answered
```

### R10.2: Challenge URLs
**Dependencies**: R10.1
```
WHEN a user visits a shared challenge URL
THE SYSTEM SHALL present the same questions in the same order, allowing them to compete directly
```

```
WHEN a user completes a shared challenge
THE SYSTEM SHALL show their score compared to the original challenger's score
```

## R11: Mixed Question Type UI

### R11.1: Passage Display
**Dependencies**: R3.3, R4.2
```
WHEN a user reaches a passage-based question section
THE SYSTEM SHALL display the passage title and text in a prominent, easily readable format above the questions
```

```
WHEN a user is answering passage-based questions
THE SYSTEM SHALL keep the passage text visible and accessible (sticky header or expandable section) throughout all questions in that passage set
```

```
WHEN transitioning between standalone and passage-based questions
THE SYSTEM SHALL clearly indicate the question type and provide visual cues about the current context (e.g., "Question 3 of 5 - Based on passage above")
```

### R11.2: Progress Tracking
**Dependencies**: R11.1
```
WHEN displaying challenge progress
THE SYSTEM SHALL show question numbers (1-10) with visual indicators for standalone vs passage-based questions
```

```
WHEN a user completes a passage section
THE SYSTEM SHALL provide a brief transition screen before moving to the next section type
```

## R12: Performance & Analytics

### R12.1: Session Tracking
**Dependencies**: R3.3, R4.2
```
WHEN any game session is completed
THE SYSTEM SHALL record total_questions, correct_answers, and time_spent_seconds for analytics
```

```
WHEN a user answers any question
THE SYSTEM SHALL record time_spent_seconds per question for difficulty calibration
```

### R12.2: User Progress
**Dependencies**: R12.1
```
WHEN a user accesses their profile
THE SYSTEM SHALL display progress statistics (total questions answered, average accuracy, longest streak, total coins earned)
```

```
WHEN a user views game type selection
THE SYSTEM SHALL show their personal best score and accuracy percentage for each category
```

## Cross-Cutting Requirements

### CR1: Error Handling
```
WHEN any database operation fails
THE SYSTEM SHALL log the error details and display a user-friendly message without exposing technical details
```

```
WHEN a user attempts an action without proper authentication
THE SYSTEM SHALL redirect to login page with return URL preserved
```

### CR2: Data Validation
```
WHEN any user input is received
THE SYSTEM SHALL validate against expected formats and ranges before database operations
```

```
WHEN importing content data
THE SYSTEM SHALL validate all required fields and relationships before committing to database
```

### CR3: Performance
```
WHEN a user navigates between screens
THE SYSTEM SHALL respond within 200ms for cached data and 1 second for server requests
```

```
WHEN the daily challenge loads
THE SYSTEM SHALL preload all question images to ensure smooth progression
```