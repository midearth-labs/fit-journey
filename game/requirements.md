# Phase 1 - Structured Requirements

## R1: Database Schema & Static Content Generation

### R1.1: Database Structure
**Dependencies**: None
```
WHEN the application initializes
THE SYSTEM SHALL create all required SQL tables matching the entity models as defined in entities.md
```

### R1.2: Static Content Creation
**Dependencies**: None
```
WHEN content generation is initiated
THE SYSTEM SHALL accept ContentCategory input definitions and use them as the foundation for generating all related content e.g. (Equipment Identification, Form Check, Nutrition Myths vs Facts, Injury Prevention, Body Mechanics, Foundational Movements, Exercise Identification)
```

```
WHEN storing static content
THE SYSTEM SHALL save JSON files in an appropriately named sub-directory by the entity name under the static content directory
```

```
WHEN generating static content
THE SYSTEM SHALL create StreakType data as a single JSON file with values as in the entity comments
```

```
WHEN generating static content
THE SYSTEM SHALL create AvatarAsset data as a single JSON file with all defined avatar gender/age_range combinations (male_teen, female_young-adult) stored in the repository.
THE SYSTEM SHALL compose LLM prompts to be used to call an Image generation LLM to create the images for each combination 
```

### R1.3: LLM Content Generation
**Dependencies**: R1.2
```
WHEN generating Questions using LLM
THE SYSTEM SHALL create coherent standalone questions as JSON files following the Question entity format with proper validation for required fields (question_text, options array with 2-4 items, correct_answer_index, explanation, content_category_id, difficulty_level, is_standalone: true, passage_set_id: null). Group and store questions for each content categories and name each content category file accordingly e.g. ${ContentCategory.id}.json
```

```
WHEN generating PassageSet content using LLM
THE SYSTEM SHALL create PassageSet entities and associated Question entities as JSON files with is_standalone: false and proper passage_set_id references, ensuring content coherence across all related entities. Group and store questions for each content categories and name each content category file accordingly e.g. ${ContentCategory.id}.json
```

```
WHEN generating passage-based questions using LLM
THE SYSTEM SHALL ensure each question properly references a valid PassageSet and that the PassageSet.question_count matches the number of associated questions in the generated JSON files
```

```
WHEN using LLM for content generation
THE SYSTEM SHALL generate KnowledgeBase entities as JSON files that are thematically and conceptually aligned with the corresponding Questions and PassageSets to ensure educational coherence. Group and store questions for each content categories and name each content category file accordingly e.g. ${ContentCategory.id}.json
```

### R1.4: LLM-Generated DailyChallenge Creation
**Dependencies**: R1.2, R1.3
```
WHEN generating DailyChallenge content using LLM
THE SYSTEM SHALL create DailyChallenge entities as a single JSON file with proper validation for required fields (day, content_category_id, challenge_structure, total_questions, theme) ensuring thematic coherence with previously generated Questions and PassageSets
```

```
WHEN generating daily challenges using LLM
THE SYSTEM SHALL ensure all referenced question_ids and passage_set_ids in the challenge_structure correspond to previously generated JSON content files
```

```
WHEN generating daily challenges using LLM
THE SYSTEM SHALL validate that the total_questions field matches the actual count of questions in the challenge_structure within the generated JSON files
```

```
WHEN generating daily challenges using LLM
THE SYSTEM SHALL ensure that challenge_structure maintains proper difficulty distribution (3 easy, 4 medium, 3 hard) across all questions and maintains educational progression throughout the challenge series
```

```
WHEN using LLM for DailyChallenge generation
THE SYSTEM SHALL generate challenges that reference and build upon the KnowledgeBase content to create a cohesive learning experience across all generated entities
```

## R2: User Profile Management

### R2.1: Profile Creation
**Dependencies**: R1.1 (Authentication assumed in place)
```
WHEN a new user completes authentication
THE SYSTEM SHALL create a User with values (email based on authentication data)
```

```
WHEN a new user completes authentication
THE SYSTEM SHALL present the user with a profile setup view so they can set up their profile
```

```
WHEN a user tries to access any authenticated part of the app e.g. daily challenges etc and they haven't setup their profile (i.e. having a valid User.display_name)
THE SYSTEM SHALL prompt the user to setup their profile first.
```

### R2.2: Profile Setup
**Dependencies**: R2.1, R1.2
```
WHEN a new user accesses profile setup
THE SYSTEM SHALL display fields to input a required field like the display name, and also optional fields like their avatar gender, avatar age_range, and timezone, 
```

```
WHEN a user submits profile information
THE SYSTEM SHALL update their UserProfile accordingly and also update the corresponding avatar image
```

## R3: Daily Challenge System

### R3.1: Challenge Access
**Dependencies**: R1.4
```
WHEN a user accesses the app and clicks "Start Today's Challenge"
THE SYSTEM SHALL automatically determine the next available daily challenge based on their progress:
- If user has no previous sessions, start with day 1
- If user has a previous session of day N but did not attempt or complete it, then clone the day N session again
- If user's latest session was day N, provide day N+1
- If user has completed all available challenges, show completion message
```

```
WHEN a user has completed the daily challenge
THE SYSTEM SHALL show completion status and next day's challenge availability
```

```
WHEN the current day's challenge is not available in the static content files
THE SYSTEM SHALL display a fallback message indicating that new challenges will be available soon
```

### R3.2: Challenge Completion
**Dependencies**: R3.1
```
WHEN a user starts a daily challenge
THE SYSTEM SHALL create a GameSession record and present questions according to the DailyChallenge.challenge_structure sequence, started_at to current timestamp, in_progress to true, and completed_at to null, session_date_utc to the date part of the current timestamp in UTC timezone.
The SYSTEM SHALL update the UserProfile.latest_game_session to the ID of the new  session. 
```

```
WHEN a user encounters a passage-based question section
THE SYSTEM SHALL display the passage text prominently and allow the user to reference it while answering all associated questions
```

```
WHEN a user answers all questions in a daily challenge
THE SYSTEM SHALL present a "Submit Challenge" button and a VIEW that allows the user to review all answers before final submission
```

```
WHEN a user submits the completed challenge
THE SYSTEM SHALL validate the GameSession is still current and update the session with all user_answers, completion status, and performance metrics
```

```
WHEN a user submits the completed challenge
THE SYSTEM shall check if the user requests GameSession id is still same as the UserProfile.latest_game_session and show the user a message to refresh if not matching.
THE SYSTEM SHALL check if the day's session is still answerable (i.e. in_progress is true)
THE SYSTEM SHALL update the GameSession record with in_progress as null, all_correct_answers, completed_at to current timestamp, user_answers to an array of answers to the daily challenge questions including properties like hint_used, is_correct etc
THE SYSTEM SHALL create or update the matching days' (use logic: GameSession.session_date_utc is StreakLog.date_utc) StreakLog entry property with the quiz_completed, quiz_passed properties
```

### R3.3: Challenge Retry System
**Dependencies**: R3.2
```
WHEN a user fails to answer all questions correctly in a daily challenge before the current day ends i.e. in_progress is null AND all_correct_answers is false
THE SYSTEM SHALL allow the user to retry the challenge up to 3 times total (attempt_count maximum of 3) until 11:59 PM in the session_timezone
```

```
WHEN a user starts a retry attempt for a daily challenge
THE SYSTEM SHALL first log the retry action and all priot data through the application logging system
THE SYSTEM SHALL reset the current GameSession by setting in_progress to true and started_at to current_timestamp, completed_at to null, and user_answers to null, and all_correct_answers to null,
THE SYSTEM SHALL increment the current GameSession.attempt_count by 1 and present the same questions in the same order
```

```
WHEN a user reaches the maximum attempt count (3) for a daily challenge
THE SYSTEM SHALL prevent further attempts for that day and mark the challenge as failed for streak calculation purposes
```

### R3.4: Session Timezone Locking
**Dependencies**: R3.1, R3.2
```
WHEN a user starts a daily challenge
THE SYSTEM SHALL store the user's current timezone as session_timezone in the GameSession record
```

```
WHEN calculating daily boundaries for challenge completion
THE SYSTEM SHALL use the session_timezone stored in GameSession, not the user's current profile timezone
```

```
WHEN calculating streaks and daily statistics
THE SYSTEM SHALL use the session_timezone from each individual GameSession for date calculations
```

```
WHEN a user changes their profile timezone
THE SYSTEM SHALL only affect future GameSessions, leaving existing sessions unchanged
```

```
WHEN determining if a challenge can still be completed
THE SYSTEM SHALL compare the current server time (converted to session_timezone) against the challenge start day
```

```
WHEN a user attempts to manipulate their timezone to extend challenge windows
THE SYSTEM SHALL prevent completion by enforcing the locked session_timezone for all calculations
```

## R4: Individual Game Sessions

### R4.1: Game Type Selection
**Dependencies**: R1.2, R1.3, R1.4
```
WHEN a user accesses the games section
THE SYSTEM SHALL display all available ContentCategory options with icons, descriptions, and question counts
```

```
WHEN a user selects a specific content category and clicks "Start Practice"
THE SYSTEM SHALL return 10 random questions from that category without creating a persistent session
```

```
WHEN a user completes a practice session
THE SYSTEM SHALL display performance summary and return to category selection without storing session data
```

### R4.2: Practice Session Flow
**Dependencies**: R4.1
```
WHEN a user starts a practice session
THE SYSTEM SHALL select 10 questions (mix of standalone and passage-based as available). IMPORTANT: A practice session is ephemeral and never stored as a GameSession but just returned to the User API request.
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
THE SYSTEM SHALL show performance summary (X/5 correct, time taken)
```

## R5: Streak Management

### R5.1: Multi-Type Streak Tracking
**Dependencies**: R3.4, R6.1
```
WHEN a user completes their first daily challenge
THE SYSTEM SHALL create a StreakHistory record with streak_type "quiz_completed", streak_length 1, started_date as today, ended_date null, and update UserProfile.current_streak_ids.quiz_completed to reference this StreakHistory record
```

```
WHEN a user completes a daily challenge on consecutive days
THE SYSTEM SHALL increment the current StreakHistory.streak_length for streak_type "quiz_completed" by 1
```

```
WHEN a user completes and answers all questions correctly for a daily challenge on consecutive days
THE SYSTEM SHALL increment the current StreakHistory.streak_length for streak_type "quiz_passed" by 1
```

```
WHEN a user misses a daily challenge (no completion by 11:59 PM in their timezone)
THE SYSTEM SHALL set the current StreakHistory.ended_date to yesterday for streak_type "quiz_completed", remove the reference from UserProfile.current_streak_ids.quiz_completed, and create a new StreakHistory record when they resume
```

```
WHEN a user logs any habit completion in StreakLog
THE SYSTEM SHALL check for consecutive days of that habit and create/update corresponding StreakHistory records for each streak_type (workout_completed, ate_clean, slept_well, hydrated)
```

```
WHEN a user completes all habits in a single day (all entries in StreakLog.entries are true)
THE SYSTEM SHALL create/update a StreakHistory record for streak_type "all" representing a "Perfect Day" streak
```

### R5.2: Streak Milestones & Records
**Dependencies**: R5.1
```
WHEN any StreakHistory.streak_length reaches a milestone value (7, 14, 30 days) for any streak_type
THE SYSTEM SHALL check for and award corresponding achievements specific to that streak type
```

```
WHEN any current streak length exceeds the corresponding longest streak
THE SYSTEM SHALL update UserProfile.longest_streaks object with the StreakHistory ID for that streak_type
```

```
WHEN displaying user progress
THE SYSTEM SHALL retrieve current streak lengths by reading StreakHistory records for all the values in UserProfile.current_streak_ids
```

### R5.3: Fitness Level Progression
**Dependencies**: R5.1
```
WHEN a user completes a daily quiz, or submits daily habit information
THE SYSTEM SHALL automatically compute the fitness level (-5 to +5) based on the history of quiz results and habits
```

```
WHEN a user's fitness level changes from a prior level,
THE SYSTEM SHALL automatically create the new fitness level as a new entry in FitnessLevelHistory
THE SYSTEM shall update this new value into UserProfile.current_fitness_level 
```


## R6: Habit Logging

### R6.1: Daily Habit Interface
**Dependencies**: R1.1, R1.2
```
WHEN a user accesses the daily habits section
THE SYSTEM SHALL display toggle buttons for all habit types defined in StreakType ("Workout Completed", "Clean Eating", "Quality Sleep", "Hydration Goal") with current day's status from StreakLog.entries
```

```
WHEN a user completes the habit logging form and submits
THE SYSTEM SHALL update or create today's StreakLog record with the new values in the entries object using StreakType IDs as keys (workout_completed, ate_clean, slept_well, hydrated)
```

```
WHEN a user marks any habit as completed
THE SYSTEM SHALL trigger streak calculation for that specific habit type and update corresponding StreakHistory records
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
WHEN the user comes back online after answering questions offline, or logging habits offline
THE SYSTEM SHALL sync the submission attempt, and habit records and progress data to the server
```

## R9: Basic Notifications

### R9.1: Notification Opt-in
**Dependencies**: R8.1
```
WHEN a user completes a challenge
THE SYSTEM SHALL request permission for Browser notifications using the Notifications API with clear benefit explanation
```

```
WHEN a user installs the PWA
THE SYSTEM SHALL request permission for push notifications with clear benefit explanation
```

```
WHEN a user grants notification permission
THE SYSTEM SHALL update their User.notification_preferences and preferred_reminder_time
```

### R9.2: Daily Reminders
**Dependencies**: R9.1
```
WHEN a user has not completed their daily challenge by time {User.preferred_reminder_time or default "19:00"} in their timezone { User.timezone or default "UTC-7" }
THE SYSTEM SHALL send a push notification "Your daily fitness knowledge challenge is waiting!"
```

```
WHEN a user has a streak of 3+ days and hasn't completed today's challenge by "21:00""
THE SYSTEM SHALL send a push notification "Don't break your X-day streak!"
```

## R10: Social Sharing

### R10.1: Result Sharing
**Dependencies**: R3.2, R4.2
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
**Dependencies**: R3.2, R4.2
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
**Dependencies**: R3.2, R4.2
```
WHEN any game session is completed
THE SYSTEM SHALL log total_questions, correct_answers, and time_spent_seconds for analytics
```

### R12.2: User Progress
**Dependencies**: R12.1
```
WHEN a user accesses their profile
THE SYSTEM SHALL display progress statistics (total questions answered, average accuracy, longest streak, current streak, current fitness level, fitness level history, last_activity_date etc)
```

```
WHEN displaying avatar
THE SYSTEM SHALL display using the "0" fitness level if the user doesn't have a valid UserProfile.current_fitness_level
```

```
WHEN displaying avatar
THE SYSTEM SHALL display a generic default Icon if the user doesn't have a valid avatar age range and gender defined on their profile.
```

```
WHEN a user views content category selection
THE SYSTEM SHALL show their personal best score and accuracy percentage for each category
```

## R14: User Authentication Integration

### R14.1: Supabase Auth Synchronization
**Dependencies**: R1.1
```
WHEN the application initializes with Supabase
THE SYSTEM SHALL create a database trigger to automatically populate the User table from Supabase's Auth table using the pattern documented at https://supabase.com/docs/guides/auth/managing-user-data
```

```
WHEN a new user signs up through Supabase Auth
THE SYSTEM SHALL automatically create a corresponding User record with email from the auth data and default null values for optional fields
```

## R15: Activity Tracking

### R15.1: Last Activity Updates
**Dependencies**: R3.2, R6.1
```
WHEN a user completes a daily quiz
THE SYSTEM SHALL update UserProfile.last_activity_date to the current date
```

```
WHEN a user logs any habit in StreakLog
THE SYSTEM SHALL update UserProfile.last_activity_date to the current date
```

```
WHEN displaying user engagement metrics
THE SYSTEM SHALL use UserProfile.last_activity_date to determine user activity status and engagement levels
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
WHEN building the application
THE SYSTEM SHALL load static content and validate all required fields and relationships before succeeding the application build.
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

### CR4: System Wide Defaults
```
WHEN a user's timezone is not configured or invalid
THE SYSTEM SHALL assume "UTC-7"
```

```
WHEN a user's preferred_reminder_time is not configured or invalid
THE SYSTEM SHALL assume "19:00"
```
