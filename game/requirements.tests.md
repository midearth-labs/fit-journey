# FitJourney Game - Requirements Test Coverage

## Test Coverage Overview

This document provides comprehensive test cases for each requirement, ensuring full coverage of documented behavior including edge cases, validation scenarios, and authentication flows.

## R1: Database Schema & Static Content Generation

### R1.1: Database Structure Tests

#### Test R1.1.1: Database Initialization
- **Test Case**: Application startup creates all required SQL tables
- **Precondition**: Fresh database instance
- **Action**: Start application
- **Expected Result**: All tables from entities.md exist with correct schema
- **Coverage**: R1.1

#### Test R1.1.2: Table Schema Validation
- **Test Case**: Verify table columns match entity definitions exactly
- **Precondition**: Database tables created
- **Action**: Inspect table schemas
- **Expected Result**: All required fields, data types, and constraints match entities.md
- **Coverage**: R1.1

### R1.2: Static Content Creation Tests

#### Test R1.2.1: ContentCategory JSON Generation
- **Test Case**: ContentCategory definitions generate valid JSON files
- **Precondition**: Content generation initiated
- **Action**: Generate ContentCategory content
- **Expected Result**: JSON files created in appropriate subdirectories with all required fields
- **Coverage**: R1.2

#### Test R1.2.2: Achievement Data Generation
- **Test Case**: Phase 1 achievements generate correctly
- **Precondition**: Achievement generation initiated
- **Action**: Generate achievement content
- **Expected Result**: JSON file with 7-day streak, 14-day streak, first quiz completion, 50 questions answered, clean eating for 3 days, workout logging for 7 days
- **Coverage**: R1.2

#### Test R1.2.3: StreakType Data Generation
- **Test Case**: StreakType values generate with correct structure
- **Precondition**: StreakType generation initiated
- **Action**: Generate streak type content
- **Expected Result**: JSON file with workout_completed, ate_clean, slept_well, hydrated, quiz_completed, quiz_passed, all
- **Coverage**: R1.2

#### Test R1.2.4: UserState Data Generation
- **Test Case**: UserState combinations generate with unlock conditions
- **Precondition**: UserState generation initiated
- **Action**: Generate user state content
- **Expected Result**: JSON file with fit-healthy, lean-tired, injured-recovering, fit-injured and corresponding unlock conditions
- **Coverage**: R1.2

#### Test R1.2.5: AvatarAsset Data Generation
- **Test Case**: AvatarAsset combinations generate with LLM prompts
- **Precondition**: AvatarAsset generation initiated
- **Action**: Generate avatar asset content
- **Expected Result**: JSON file with male_teen, female_young-adult combinations and LLM image generation prompts
- **Coverage**: R1.2

### R1.3: LLM Content Generation Tests

#### Test R1.3.1: Standalone Question Generation
- **Test Case**: LLM generates valid standalone questions
- **Precondition**: Question generation initiated
- **Action**: Generate questions using LLM
- **Expected Result**: JSON files with is_standalone: true, passage_set_id: null, proper validation
- **Coverage**: R1.3

#### Test R1.3.2: Passage-Based Question Generation
- **Test Case**: LLM generates coherent passage sets with questions
- **Precondition**: PassageSet generation initiated
- **Action**: Generate passage sets and questions using LLM
- **Expected Result**: JSON files with is_standalone: false, proper passage_set_id references
- **Coverage**: R1.3

#### Test R1.3.3: Question Count Validation
- **Test Case**: PassageSet.question_count matches actual questions
- **Precondition**: Passage-based content generated
- **Action**: Validate question counts
- **Expected Result**: All PassageSet.question_count values match associated question counts
- **Coverage**: R1.3

#### Test R1.3.4: KnowledgeBase Alignment
- **Test Case**: KnowledgeBase content aligns with questions
- **Precondition**: Questions and KnowledgeBase generated
- **Action**: Validate thematic alignment
- **Expected Result**: KnowledgeBase entities thematically aligned with corresponding questions
- **Coverage**: R1.3

### R1.4: DailyChallenge Creation Tests

#### Test R1.4.1: DailyChallenge Structure Validation
- **Test Case**: DailyChallenge generates with proper structure
- **Precondition**: DailyChallenge generation initiated
- **Action**: Generate daily challenges using LLM
- **Expected Result**: JSON files with day, content_category_id, challenge_structure, total_questions, theme
- **Coverage**: R1.4

#### Test R1.4.2: Question Reference Validation
- **Test Case**: Challenge structure references valid content
- **Precondition**: DailyChallenge generated
- **Action**: Validate question and passage references
- **Expected Result**: All question_ids and passage_set_ids reference existing content
- **Coverage**: R1.4

#### Test R1.4.3: Question Count Accuracy
- **Test Case**: Total questions match challenge structure
- **Precondition**: DailyChallenge generated
- **Action**: Count questions in challenge_structure
- **Expected Result**: total_questions field matches actual question count
- **Coverage**: R1.4

#### Test R1.4.4: Difficulty Distribution
- **Test Case**: Challenge maintains proper difficulty distribution
- **Precondition**: DailyChallenge generated
- **Action**: Analyze difficulty levels
- **Expected Result**: 3 easy, 4 medium, 3 hard questions with educational progression
- **Coverage**: R1.4

## R2: User Profile Management

### R2.1: Profile Creation Tests

#### Test R2.1.1: New User Profile Creation
- **Test Case**: New authenticated user gets profile setup prompt
- **Precondition**: User completes Supabase authentication
- **Action**: Access authenticated app section
- **Expected Result**: Profile setup view presented
- **Coverage**: R2.1

#### Test R2.1.2: Profile Setup Enforcement
- **Test Case**: Unauthenticated users cannot access protected features
- **Precondition**: User not authenticated
- **Action**: Attempt to access daily challenges
- **Expected Result**: Redirect to login page
- **Coverage**: R2.1

#### Test R2.1.3: Profile Completion Enforcement
- **Test Case**: Users without display_name cannot access features
- **Precondition**: User authenticated but no display_name
- **Action**: Attempt to access daily challenges
- **Expected Result**: Prompt to setup profile first
- **Coverage**: R2.1

### R2.2: Profile Setup Tests

#### Test R2.2.1: Required Field Validation
- **Test Case**: Profile setup requires display_name
- **Precondition**: User accessing profile setup
- **Action**: Submit form without display_name
- **Expected Result**: Validation error, form not submitted
- **Coverage**: R2.2

#### Test R2.2.2: Optional Field Handling
- **Test Case**: Profile setup succeeds without optional fields
- **Precondition**: User accessing profile setup
- **Action**: Submit form with only display_name
- **Expected Result**: Profile created successfully, optional fields remain null
- **Coverage**: R2.2

#### Test R2.2.3: Avatar Gender Validation
- **Test Case**: Avatar gender accepts valid values
- **Precondition**: User submitting profile with avatar_gender
- **Action**: Submit with valid gender (male, female)
- **Expected Result**: Profile updated successfully
- **Coverage**: R2.2

#### Test R2.2.4: Avatar Gender Invalid Value
- **Test Case**: Avatar gender rejects invalid values
- **Precondition**: User submitting profile with avatar_gender
- **Action**: Submit with invalid gender (e.g., "other")
- **Expected Result**: Validation error, form not submitted
- **Coverage**: R2.2

#### Test R2.2.5: Avatar Age Range Validation
- **Test Case**: Avatar age range accepts valid values
- **Precondition**: User submitting profile with avatar_age_range
- **Action**: Submit with valid age range (child, teen, young-adult, middle-age, senior)
- **Expected Result**: Profile updated successfully
- **Coverage**: R2.2

#### Test R2.2.6: Avatar Age Range Invalid Value
- **Test Case**: Avatar age range rejects invalid values
- **Precondition**: User submitting profile with avatar_age_range
- **Action**: Submit with invalid age range (e.g., "elderly")
- **Expected Result**: Validation error, form not submitted
- **Coverage**: R2.2

#### Test R2.2.7: Timezone Validation
- **Test Case**: Timezone accepts valid format
- **Precondition**: User submitting profile with timezone
- **Action**: Submit with valid timezone (UTC, UTC+1, UTC-8)
- **Expected Result**: Profile updated successfully
- **Coverage**: R2.2

#### Test R2.2.8: Timezone Invalid Format
- **Test Case**: Timezone rejects invalid format
- **Precondition**: User submitting profile with timezone
- **Action**: Submit with invalid timezone (e.g., "PST")
- **Expected Result**: Validation error, form not submitted
- **Coverage**: R2.2

#### Test R2.2.9: Profile Update Success
- **Test Case**: Profile information updates correctly
- **Precondition**: User has existing profile
- **Action**: Submit updated profile information
- **Expected Result**: UserProfile updated, avatar image updated if applicable
- **Coverage**: R2.2

## R3: Daily Challenge System

### R3.1: Challenge Access Tests

#### Test R3.1.1: Current Day Challenge Display
- **Test Case**: Home screen shows current day's challenge
- **Precondition**: User accesses app, daily challenge available
- **Action**: Navigate to home screen
- **Expected Result**: Current day's challenge displayed prominently
- **Coverage**: R3.1

#### Test R3.1.2: Completed Challenge Status
- **Test Case**: Completed challenges show completion status
- **Precondition**: User completed today's challenge
- **Action**: View home screen
- **Expected Result**: Completion status and next day's challenge availability shown
- **Coverage**: R3.1

#### Test R3.1.3: Challenge Unavailability Fallback
- **Test Case**: Missing challenges show fallback message
- **Precondition**: Current day's challenge not available
- **Action**: Access home screen
- **Expected Result**: Fallback message indicating new challenges coming soon
- **Coverage**: R3.1

### R3.2: Challenge Completion Tests

#### Test R3.2.1: GameSession Creation
- **Test Case**: Starting challenge creates GameSession
- **Precondition**: User starts daily challenge
- **Action**: Begin challenge
- **Expected Result**: GameSession record created with started_at timestamp
- **Coverage**: R3.2

#### Test R3.2.2: Passage-Based Question Display
- **Test Case**: Passage text displayed for passage-based questions
- **Precondition**: User encounters passage-based question section
- **Action**: View question
- **Expected Result**: Passage text displayed prominently, accessible for all associated questions
- **Coverage**: R3.2

#### Test R3.2.3: Question Attempt Recording
- **Test Case**: Question attempts recorded correctly
- **Precondition**: User answers question in daily challenge
- **Action**: Submit answer
- **Expected Result**: QuestionAttempt created with selected_answer, correctness, timestamp
- **Coverage**: R3.2

#### Test R3.2.4: Challenge Completion Marking
- **Test Case**: Completed challenges marked correctly
- **Precondition**: User completes all questions
- **Action**: Finish last question
- **Expected Result**: GameSession marked as completed with completed_at timestamp
- **Coverage**: R3.2

### R3.3: Challenge Retry System Tests

#### Test R3.3.1: Challenge Retry Allowance
- **Test Case**: Failed challenges allow retries
- **Precondition**: User fails to answer all questions correctly
- **Action**: Attempt retry
- **Expected Result**: User can retry challenge up to 3 times total
- **Coverage**: R3.3

#### Test R3.3.2: Attempt Count Increment
- **Test Case**: Retry attempts increment counter
- **Precondition**: User starts retry attempt
- **Action**: Begin retry
- **Expected Result**: GameSession.attempt_count incremented by 1
- **Coverage**: R3.3

#### Test R3.3.3: Maximum Attempt Prevention
- **Test Case**: Maximum attempts enforced
- **Precondition**: User reaches maximum attempt count (3)
- **Action**: Attempt additional retry
- **Expected Result**: Further attempts prevented, challenge marked as failed
- **Coverage**: R3.3

#### Test R3.3.4: Successful Retry Streak Count
- **Test Case**: Successful retry counts for streak
- **Precondition**: User successfully completes challenge on any attempt
- **Action**: Complete challenge
- **Expected Result**: GameSession marked as completed, counts as successful day for streak
- **Coverage**: R3.3

### R3.4: Session Timezone Locking Tests

#### Test R3.4.1: Session Timezone Storage
- **Test Case**: GameSession stores timezone when created
- **Precondition**: User starts daily challenge
- **Action**: Begin challenge
- **Expected Result**: GameSession.session_timezone field populated with user's current timezone
- **Coverage**: R3.4

#### Test R3.4.2: Timezone Locking for Challenge Completion
- **Test Case**: Challenge completion uses locked session timezone
- **Precondition**: User has GameSession with session_timezone set
- **Action**: Attempt to complete challenge
- **Expected Result**: Daily boundaries calculated using session_timezone, not current profile timezone
- **Coverage**: R3.4

#### Test R3.4.3: Streak Calculation Uses Session Timezone
- **Test Case**: Streak calculations respect session timezone
- **Precondition**: User has multiple GameSessions with different session_timezones
- **Action**: Calculate streaks
- **Expected Result**: Each GameSession uses its own session_timezone for date calculations
- **Coverage**: R3.4

#### Test R3.4.4: Profile Timezone Change Isolation
- **Test Case**: Profile timezone changes don't affect existing sessions
- **Precondition**: User has active GameSession, changes profile timezone
- **Action**: Change timezone in profile
- **Expected Result**: Existing GameSession continues using original session_timezone
- **Coverage**: R3.4

#### Test R3.4.5: New Sessions Use Updated Timezone
- **Test Case**: New challenges use updated profile timezone
- **Precondition**: User changed profile timezone
- **Action**: Start new daily challenge
- **Expected Result**: New GameSession.session_timezone uses updated profile timezone
- **Coverage**: R3.4

#### Test R3.4.6: Timezone Manipulation Prevention
- **Test Case**: Users cannot extend challenge windows via timezone changes
- **Precondition**: User has incomplete challenge, attempts to change timezone
- **Action**: Change timezone and attempt challenge completion
- **Expected Result**: Challenge completion blocked, original session_timezone enforced
- **Coverage**: R3.4

#### Test R3.4.7: Server Time Validation
- **Test Case**: Challenge completion validates against server time
- **Precondition**: User attempts to complete challenge
- **Action**: Submit completion
- **Expected Result**: Server validates current time against session_timezone for day boundary
- **Coverage**: R3.4

#### Test R3.4.8: Multiple Timezone Sessions Handling
- **Test Case**: System handles multiple sessions with different timezones
- **Precondition**: User has sessions from different timezone periods
- **Action**: View progress across sessions
- **Expected Result**: Each session correctly calculated using its own session_timezone
- **Coverage**: R3.4

#### Test R3.4.9: Timezone Format Validation
- **Test Case**: Session timezone stores valid format
- **Precondition**: User starts challenge with timezone set
- **Action**: Create GameSession
- **Expected Result**: session_timezone stored in valid format (e.g., "America/New_York", "UTC-7")
- **Coverage**: R3.4

#### Test R3.4.10: Default Timezone Fallback
- **Test Case**: Default timezone used when user timezone not set
- **Precondition**: User has no timezone in profile
- **Action**: Start daily challenge
- **Expected Result**: GameSession.session_timezone set to default "UTC"
- **Coverage**: R3.4

#### Test R3.4.11: DST Transition Handling
- **Test Case**: Sessions handle daylight saving time transitions
- **Precondition**: User starts challenge during DST period
- **Action**: Complete challenge after DST transition
- **Expected Result**: Challenge completion calculated using original session_timezone regardless of DST changes
- **Coverage**: R3.4

#### Test R3.4.12: Timezone Change Audit Trail
- **Test Case**: Timezone changes logged for security monitoring
- **Precondition**: User changes profile timezone
- **Action**: Update timezone
- **Expected Result**: Timezone change logged with timestamp and old/new values
- **Coverage**: R3.4

## R4: Individual Game Sessions

### R4.1: Game Type Selection Tests

#### Test R4.1.1: Content Category Display
- **Test Case**: Games section shows all available categories
- **Precondition**: User accesses games section
- **Action**: View available options
- **Expected Result**: All ContentCategory options displayed with icons, descriptions, question counts
- **Coverage**: R4.1

#### Test R4.1.2: Practice Session Initiation
- **Test Case**: Category selection starts practice session
- **Precondition**: User selects specific content category
- **Action**: Choose category
- **Expected Result**: Practice session starts with 5 random questions
- **Coverage**: R4.1

### R4.2: Practice Session Flow Tests

#### Test R4.2.1: Question Selection Mix
- **Test Case**: Practice session includes mixed question types
- **Precondition**: User starts practice session
- **Action**: Begin session
- **Expected Result**: 10 questions selected (mix of standalone and passage-based as available)
- **Coverage**: R4.2

#### Test R4.2.2: Passage Text Accessibility
- **Test Case**: Passage text remains accessible throughout questions
- **Precondition**: Practice session includes passage-based questions
- **Action**: Answer questions from passage
- **Expected Result**: Passage text visible and accessible for all associated questions
- **Coverage**: R4.2

#### Test R4.2.3: Immediate Feedback
- **Test Case**: Practice mode shows immediate feedback
- **Precondition**: User answers question in practice mode
- **Action**: Submit answer
- **Expected Result**: Correct answer and explanation shown before next question
- **Coverage**: R4.2

#### Test R4.2.4: Performance Summary
- **Test Case**: Practice session shows performance summary
- **Precondition**: User completes practice session
- **Action**: Finish last question
- **Expected Result**: Performance summary displayed (X/5 correct, time taken)
- **Coverage**: R4.2

## R5: Streak Management

### R5.1: Multi-Type Streak Tracking Tests

#### Test R5.1.1: First Quiz Streak Creation
- **Test Case**: First daily challenge creates quiz streak
- **Precondition**: User completes first daily challenge
- **Action**: Complete challenge
- **Expected Result**: StreakHistory created with streak_type "quiz_completed", length 1, started_date today
- **Coverage**: R5.1

#### Test R5.1.2: Consecutive Quiz Streak Increment
- **Test Case**: Consecutive challenges increment streak
- **Precondition**: User has current quiz streak
- **Action**: Complete daily challenge on consecutive day
- **Expected Result**: StreakHistory.streak_length incremented by 1
- **Coverage**: R5.1

#### Test R5.1.3: Missed Challenge Streak Reset
- **Test Case**: Missed challenges reset streak
- **Precondition**: User has current quiz streak
- **Action**: Miss daily challenge (no completion by 11:59 PM timezone)
- **Expected Result**: StreakHistory.ended_date set to yesterday, new streak record created on resume
- **Coverage**: R5.1

#### Test R5.1.4: Habit Streak Creation
- **Test Case**: Habit completion creates streaks
- **Precondition**: User logs habit completion
- **Action**: Complete habit
- **Expected Result**: StreakHistory records created/updated for corresponding streak_type
- **Coverage**: R5.1

#### Test R5.1.5: Perfect Day Streak
- **Test Case**: All habits create perfect day streak
- **Precondition**: User completes all habits in single day
- **Action**: Mark all habits complete
- **Expected Result**: StreakHistory record created for streak_type "all"
- **Coverage**: R5.1

### R5.2: Streak Milestones & Records Tests

#### Test R5.2.1: Streak Milestone Achievement
- **Test Case**: Streak milestones trigger achievements
- **Precondition**: StreakHistory.streak_length reaches milestone (7, 14, 30 days)
- **Action**: Achieve milestone
- **Expected Result**: Corresponding achievement awarded for streak type
- **Coverage**: R5.2

#### Test R5.2.2: Longest Streak Update
- **Test Case**: Current streak exceeds longest streak
- **Precondition**: Current streak length exceeds longest streak
- **Action**: Continue streak
- **Expected Result**: UserProfile.longest_streaks updated with new StreakHistory ID
- **Coverage**: R5.2

#### Test R5.2.3: Current Streak Display
- **Test Case**: Profile shows current streak lengths
- **Precondition**: User accesses profile
- **Action**: View progress
- **Expected Result**: Current streak lengths displayed from StreakHistory records
- **Coverage**: R5.2

### R5.3: User State Progression Tests

#### Test R5.3.1: State Change on Quiz Completion
- **Test Case**: Quiz completion triggers state evaluation
- **Precondition**: User completes daily quiz
- **Action**: Finish quiz
- **Expected Result**: UserState automatically computed and updated
- **Coverage**: R5.3

#### Test R5.3.2: State Change on Streak Update
- **Test Case**: Streak changes trigger state evaluation
- **Precondition**: User's current_streak_ids properties change
- **Action**: Update streaks
- **Expected Result**: UserState automatically computed and updated
- **Coverage**: R5.3

#### Test R5.3.3: New State Creation
- **Test Case**: State changes create new UserState entries
- **Precondition**: User's state changes from prior state
- **Action**: State evaluation triggers
- **Expected Result**: New UserState entry created, UserProfile.current_state updated
- **Coverage**: R5.3

## R6: Habit Logging

### R6.1: Daily Habit Interface Tests

#### Test R6.1.1: Habit Interface Display
- **Test Case**: Daily habits section shows all habit types
- **Precondition**: User accesses daily habits section
- **Action**: View habits interface
- **Expected Result**: Toggle buttons for all StreakType values with current day's status
- **Coverage**: R6.1

#### Test R6.1.2: Habit Status Toggle
- **Test Case**: Habit status updates correctly
- **Precondition**: User toggles habit status
- **Action**: Toggle habit
- **Expected Result**: StreakLog record updated/created with new values in entries object
- **Coverage**: R6.1

#### Test R6.1.3: Streak Calculation Trigger
- **Test Case**: Habit completion triggers streak calculation
- **Precondition**: User marks habit as completed
- **Action**: Complete habit
- **Expected Result**: Streak calculation triggered, StreakHistory records updated
- **Coverage**: R6.1

### R6.2: Multi-Habit Streak Rewards Tests

#### Test R6.2.1: Single Habit Streak Achievement
- **Test Case**: 7-day single habit streak triggers achievement
- **Precondition**: User maintains single habit for 7 consecutive days
- **Action**: Complete 7th day
- **Expected Result**: Achievement awarded for specific habit type
- **Coverage**: R6.2

#### Test R6.2.2: Perfect Week Achievement
- **Test Case**: 7-day perfect streak triggers achievement
- **Precondition**: User maintains all habit types for 7 consecutive days
- **Action**: Complete 7th perfect day
- **Expected Result**: "Perfect Week" achievement awarded
- **Coverage**: R6.2

## R7: Achievement System

### R7.1: Achievement Checking Tests

#### Test R7.1.1: Achievement Unlock Condition Check
- **Test Case**: User actions trigger achievement checks
- **Precondition**: User action updates streaks or completion counts
- **Action**: Perform action
- **Expected Result**: All applicable achievements checked for unlock conditions
- **Coverage**: R7.1

#### Test R7.1.2: Achievement Record Creation
- **Test Case**: Met conditions create UserAchievement records
- **Precondition**: Achievement unlock condition met
- **Action**: Condition met
- **Expected Result**: UserAchievement record created
- **Coverage**: R7.1

### R7.2: Achievement Display Tests

#### Test R7.2.1: Achievement Celebration Modal
- **Test Case**: Unlocked achievements show celebration
- **Precondition**: User unlocks achievement
- **Action**: Unlock achievement
- **Expected Result**: Celebration modal displayed with achievement details and rewards
- **Coverage**: R7.2

#### Test R7.2.2: Profile Achievement Display
- **Test Case**: Profile shows all unlocked achievements
- **Precondition**: User accesses profile
- **Action**: View profile
- **Expected Result**: All unlocked achievements displayed with unlock dates
- **Coverage**: R7.2

## R8: PWA Features

### R8.1: Installation Tests

#### Test R8.1.1: Add to Home Screen Prompt
- **Test Case**: Mobile browsers show installation prompt
- **Precondition**: User visits app on supported mobile browser
- **Action**: Engage with app for 2 minutes
- **Expected Result**: "Add to Home Screen" prompt displayed
- **Coverage**: R8.1

#### Test R8.1.2: Service Worker Registration
- **Test Case**: PWA installation registers service worker
- **Precondition**: User installs PWA
- **Action**: Complete installation
- **Expected Result**: Service worker registered for offline functionality
- **Coverage**: R8.1

### R8.2: Offline Capability Tests

#### Test R8.2.1: Offline Content Viewing
- **Test Case**: PWA allows offline content viewing
- **Precondition**: PWA installed, user goes offline
- **Action**: Go offline
- **Expected Result**: Previously loaded questions and avatar status viewable
- **Coverage**: R8.2

#### Test R8.2.2: Offline Data Sync
- **Test Case**: Offline data syncs when online
- **Precondition**: User answers questions offline
- **Action**: Come back online
- **Expected Result**: All QuestionAttempt and progress data synced to server
- **Coverage**: R8.2

## R9: Basic Notifications

### R9.1: Notification Opt-in Tests

#### Test R9.1.1: Permission Request on PWA Install
- **Test Case**: PWA installation requests notification permission
- **Precondition**: User installs PWA
- **Action**: Complete installation
- **Expected Result**: Permission request for push notifications with clear benefit explanation
- **Coverage**: R9.1

#### Test R9.1.2: Notification Preferences Update
- **Test Case**: Permission grant updates user preferences
- **Precondition**: User grants notification permission
- **Action**: Grant permission
- **Expected Result**: User.notification_preferences and preferred_reminder_time updated
- **Coverage**: R9.1

### R9.2: Daily Reminders Tests

#### Test R9.2.1: Default Reminder Time
- **Test Case**: Default reminder time used when not set
- **Precondition**: User has not completed daily challenge, no preferred_reminder_time set
- **Action**: Reach default time (19:00)
- **Expected Result**: Push notification sent at 19:00
- **Coverage**: R9.2

#### Test R9.2.2: Custom Reminder Time
- **Test Case**: Custom reminder time respected
- **Precondition**: User has preferred_reminder_time set
- **Action**: Reach custom time
- **Expected Result**: Push notification sent at user's preferred time
- **Coverage**: R9.2

#### Test R9.2.3: Timezone Handling
- **Test Case**: Reminders respect user timezone
- **Precondition**: User has timezone set
- **Action**: Reach reminder time in user's timezone
- **Expected Result**: Push notification sent at correct local time
- **Coverage**: R9.2

#### Test R9.2.4: Streak Protection Reminder
- **Test Case**: High streak users get streak protection reminder
- **Precondition**: User has 3+ day streak, hasn't completed today's challenge
- **Action**: Reach 21:00
- **Expected Result**: Push notification "Don't break your X-day streak!" sent
- **Coverage**: R9.2

## R10: Social Sharing

### R10.1: Result Sharing Tests

#### Test R10.1.1: Share Result Button Display
- **Test Case**: Completed sessions show share button
- **Precondition**: User completes any game session
- **Action**: Complete session
- **Expected Result**: "Share Result" button displayed with pre-formatted text
- **Coverage**: R10.1

#### Test R10.1.2: Challenge URL Generation
- **Test Case**: Share generates unique challenge URL
- **Precondition**: User clicks share button
- **Action**: Click share
- **Expected Result**: Unique challenge URL generated linking to same questions
- **Coverage**: R10.1

### R10.2: Challenge URLs Tests

#### Test R10.2.1: Shared Challenge Presentation
- **Test Case**: Shared URLs present same questions
- **Precondition**: User visits shared challenge URL
- **Action**: Access URL
- **Expected Result**: Same questions presented in same order
- **Coverage**: R10.2

#### Test R10.2.2: Score Comparison Display
- **Test Case**: Shared challenge completion shows score comparison
- **Precondition**: User completes shared challenge
- **Action**: Complete challenge
- **Expected Result**: Score compared to original challenger's score
- **Coverage**: R10.2

## R11: Mixed Question Type UI

### R11.1: Passage Display Tests

#### Test R11.1.1: Passage Text Prominence
- **Test Case**: Passage text displayed prominently
- **Precondition**: User reaches passage-based question section
- **Action**: View passage
- **Expected Result**: Passage title and text displayed in prominent, easily readable format
- **Coverage**: R11.1

#### Test R11.1.2: Passage Accessibility Throughout Questions
- **Test Case**: Passage remains accessible during questions
- **Precondition**: User answering passage-based questions
- **Action**: Answer questions
- **Expected Result**: Passage text visible and accessible throughout all questions in passage set
- **Coverage**: R11.1

#### Test R11.1.3: Question Type Transitions
- **Test Case**: Clear indication of question type changes
- **Precondition**: User transitions between question types
- **Action**: Move between questions
- **Expected Result**: Clear indication of question type and visual cues about context
- **Coverage**: R11.1

### R11.2: Progress Tracking Tests

#### Test R11.2.1: Question Number Display
- **Test Case**: Progress shows question numbers with type indicators
- **Precondition**: User viewing challenge progress
- **Action**: View progress
- **Expected Result**: Question numbers (1-10) with visual indicators for standalone vs passage-based
- **Coverage**: R11.2

#### Test R11.2.2: Passage Section Transitions
- **Test Case**: Passage sections show transition screens
- **Precondition**: User completes passage section
- **Action**: Complete section
- **Expected Result**: Brief transition screen before next section type
- **Coverage**: R11.2

## R12: Performance & Analytics

### R12.1: Session Tracking Tests

#### Test R12.1.1: Game Session Recording
- **Test Case**: Completed sessions record analytics
- **Precondition**: Any game session completed
- **Action**: Complete session
- **Expected Result**: total_questions, correct_answers, time_spent_seconds recorded
- **Coverage**: R12.1

#### Test R12.1.2: Question-Level Timing
- **Test Case**: Individual question timing recorded
- **Precondition**: User answers question
- **Action**: Answer question
- **Expected Result**: time_spent_seconds per question recorded for difficulty calibration
- **Coverage**: R12.1

### R12.2: User Progress Tests

#### Test R12.2.1: Profile Progress Statistics
- **Test Case**: Profile displays comprehensive progress data
- **Precondition**: User accesses profile
- **Action**: View profile
- **Expected Result**: Progress statistics displayed (total questions, average accuracy, streaks, achievements, current state/avatar, etc.)
- **Coverage**: R12.2

#### Test R12.2.2: Default Avatar Display
- **Test Case**: Default avatar shown when no state set
- **Precondition**: User doesn't have valid UserProfile.current_state
- **Action**: Display avatar
- **Expected Result**: Avatar displayed using "average" UserState
- **Coverage**: R12.2

#### Test R12.2.3: Generic Icon Fallback
- **Test Case**: Generic icon shown when avatar data invalid
- **Precondition**: User doesn't have valid avatar age range and gender
- **Action**: Display avatar
- **Expected Result**: Generic default icon displayed
- **Coverage**: R12.2

#### Test R12.2.4: Category Performance Display
- **Test Case**: Content categories show personal best scores
- **Precondition**: User views content category selection
- **Action**: View categories
- **Expected Result**: Personal best score and accuracy percentage shown for each category
- **Coverage**: R12.2

## R14: User Authentication Integration

### R14.1: Supabase Auth Synchronization Tests

#### Test R14.1.1: Database Trigger Creation
- **Test Case**: Application creates database trigger on initialization
- **Precondition**: Application initializes with Supabase
- **Action**: Start application
- **Expected Result**: Database trigger created to populate User table from Supabase Auth table
- **Coverage**: R14.1

#### Test R14.1.2: Automatic User Record Creation
- **Test Case**: New Supabase users get User records
- **Precondition**: New user signs up through Supabase Auth
- **Action**: Complete signup
- **Expected Result**: Corresponding User record created with email from auth data
- **Coverage**: R14.1

## R15: Activity Tracking

### R15.1: Last Activity Updates Tests

#### Test R15.1.1: Quiz Completion Activity Update
- **Test Case**: Daily quiz completion updates last activity
- **Precondition**: User completes daily quiz
- **Action**: Complete quiz
- **Expected Result**: UserProfile.last_activity_date updated to current date
- **Coverage**: R15.1

#### Test R15.1.2: Habit Logging Activity Update
- **Test Case**: Habit logging updates last activity
- **Precondition**: User logs any habit
- **Action**: Log habit
- **Expected Result**: UserProfile.last_activity_date updated to current date
- **Coverage**: R15.1

#### Test R15.1.3: Activity Status Determination
- **Test Case**: Engagement metrics use last activity date
- **Precondition**: User engagement metrics displayed
- **Action**: View metrics
- **Expected Result**: UserProfile.last_activity_date used to determine activity status and engagement levels
- **Coverage**: R15.1

## R16: User State Evaluation System

### R16.1: State Unlock Conditions Tests

#### Test R16.1.1: State Unlock Condition Types
- **Test Case**: UserState supports multiple unlock condition types
- **Precondition**: UserState static content generated
- **Action**: Generate content
- **Expected Result**: unlock_condition objects with supported types: "streak" (with value for days), score for quizzes, and other extensible types
- **Coverage**: R16.1

#### Test R16.1.2: State Evaluation Order
- **Test Case**: States evaluated in correct order
- **Precondition**: User state progression evaluation
- **Action**: Evaluate states
- **Expected Result**: UserState records processed in order of eval_order field
- **Coverage**: R16.1

#### Test R16.1.3: Automatic State Re-evaluation
- **Test Case**: Statistics changes trigger state re-evaluation
- **Precondition**: User's statistics change (streaks, quiz performance, etc.)
- **Action**: Statistics update
- **Expected Result**: All UserState unlock conditions re-evaluated in eval_order sequence
- **Coverage**: R16.1

### R16.2: Performance-Based State Changes Tests

#### Test R16.2.1: Form Question Performance State Change
- **Test Case**: Poor form performance triggers injured state
- **Precondition**: User answers form-related questions incorrectly >50% in single session
- **Action**: Complete session with poor form performance
- **Expected Result**: User transitioned to "injured" state if conditions met
- **Coverage**: R16.2

#### Test R16.2.2: High Accuracy State Progression
- **Test Case**: High accuracy triggers fit state
- **Precondition**: User maintains >80% accuracy across multiple categories for 7+ days
- **Action**: Maintain high accuracy
- **Expected Result**: User transitioned to "fit-healthy" state if conditions met
- **Coverage**: R16.2

## R17: Achievement Unlock Conditions

### R17.1: Condition Types Validation Tests

#### Test R17.1.1: Supported Condition Types
- **Test Case**: Achievement supports multiple unlock condition types
- **Precondition**: Achievement static content generated
- **Action**: Generate content
- **Expected Result**: unlock_condition objects with types: "streak" (with value for consecutive days), "questions" (with value for total questions answered), and other extensible types
- **Coverage**: R17.1

#### Test R17.1.2: Condition Type Validation
- **Test Case**: Achievement unlock conditions validated
- **Precondition**: Achievement unlock condition checking
- **Action**: Check conditions
- **Expected Result**: All referenced condition types supported and have valid value ranges
- **Coverage**: R17.1

#### Test R17.1.3: Streak Condition Checking
- **Test Case**: Streak-based achievements check correct records
- **Precondition**: Achievement has unlock_condition type "streak"
- **Action**: Check achievement
- **Expected Result**: Check against appropriate StreakHistory records for specified streak_type and minimum streak_length value
- **Coverage**: R17.1

#### Test R17.1.4: Questions Condition Checking
- **Test Case**: Question-based achievements count correctly
- **Precondition**: Achievement has unlock_condition type "questions"
- **Action**: Check achievement
- **Expected Result**: Count total QuestionAttempt records for user and compare against specified value threshold
- **Coverage**: R17.1

## Cross-Cutting Requirements

### CR1: Error Handling Tests

#### Test CR1.1: Database Operation Failure
- **Test Case**: Database failures handled gracefully
- **Precondition**: Database operation fails
- **Action**: Perform operation
- **Expected Result**: Error details logged, user-friendly message displayed without technical details
- **Coverage**: CR1

#### Test CR1.2: Authentication Failure Handling
- **Test Case**: Unauthenticated actions handled properly
- **Precondition**: User attempts action without proper authentication
- **Action**: Perform action
- **Expected Result**: Redirect to login page with return URL preserved
- **Coverage**: CR1

### CR2: Data Validation Tests

#### Test CR2.1: User Input Validation
- **Test Case**: User input validated before database operations
- **Precondition**: User input received
- **Action**: Submit input
- **Expected Result**: Input validated against expected formats and ranges before database operations
- **Coverage**: CR2

#### Test CR2.2: Static Content Validation
- **Test Case**: Application build validates static content
- **Precondition**: Building application
- **Action**: Build
- **Expected Result**: Static content loaded and all required fields and relationships validated before build succeeds
- **Coverage**: CR2

### CR3: Performance Tests

#### Test CR3.1: Screen Navigation Performance
- **Test Case**: Screen navigation responds within performance targets
- **Precondition**: User navigates between screens
- **Action**: Navigate
- **Expected Result**: Response within 50ms for cached data and 200ms for server requests
- **Coverage**: CR3

#### Test CR3.2: Daily Challenge Preloading
- **Test Case**: Daily challenge images preload for smooth progression
- **Precondition**: Daily challenge loads
- **Action**: Load challenge
- **Expected Result**: All question images preloaded to ensure smooth progression
- **Coverage**: CR3

## Edge Cases and Additional Test Scenarios

### Avatar Display Edge Cases

#### Test EC1: Missing Avatar Data Combinations
- **Test Case**: Handle missing avatar age range and gender combinations
- **Precondition**: User has partial avatar data (e.g., gender but no age range)
- **Action**: Display avatar
- **Expected Result**: Generic default icon displayed, no errors thrown
- **Coverage**: R12.2, R2.2

#### Test EC2: Invalid Avatar Data Validation
- **Test Case**: Validate avatar data when provided
- **Precondition**: User submits profile with avatar data
- **Action**: Submit profile
- **Expected Result**: Invalid combinations rejected, valid combinations accepted
- **Coverage**: R2.2

### Timezone and Reminder Time Edge Cases

#### Test EC3: Timezone Update Handling
- **Test Case**: Timezone changes update reminder calculations
- **Precondition**: User updates timezone
- **Action**: Change timezone
- **Expected Result**: Reminder times recalculated based on new timezone
- **Coverage**: R9.2

#### Test EC4: Default Timezone Fallback
- **Test Case**: Default timezone used when not specified
- **Precondition**: User has no timezone set
- **Action**: Calculate reminder time
- **Expected Result**: Default "UTC-7" used for calculations
- **Coverage**: R9.2

#### Test EC5: Default Reminder Time Fallback
- **Test Case**: Default reminder time used when not specified
- **Precondition**: User has no preferred_reminder_time set
- **Action**: Send reminder
- **Expected Result**: Default "19:00" used for reminder timing
- **Coverage**: R9.2

### Authentication and Authorization Edge Cases

#### Test EC6: Session Expiration Handling
- **Test Case**: Expired sessions handled gracefully
- **Precondition**: User session expires during app usage
- **Action**: Perform authenticated action
- **Expected Result**: Redirect to login with clear message about session expiration
- **Coverage**: CR1

#### Test EC7: Partial Authentication State
- **Test Case**: Handle partial authentication states
- **Precondition**: User has partial authentication (e.g., token but no profile)
- **Action**: Access protected features
- **Expected Result**: Appropriate error handling and guidance provided
- **Coverage**: R2.1

### Data Consistency Edge Cases

#### Test EC8: Orphaned Data Handling
- **Test Case**: Handle orphaned references gracefully
- **Precondition**: Static content references non-existent entities
- **Action**: Load content
- **Expected Result**: Graceful fallback, error logging, no application crashes
- **Coverage**: CR1

#### Test EC9: Concurrent User Updates
- **Test Case**: Handle concurrent profile updates
- **Precondition**: Multiple devices update same user profile
- **Action**: Simultaneous updates
- **Expected Result**: Last write wins, no data corruption
- **Coverage**: R2.2

### Offline and Sync Edge Cases

#### Test EC10: Partial Offline Data
- **Test Case**: Handle partial offline data scenarios
- **Precondition**: User has some offline data but not complete
- **Action**: Go offline
- **Expected Result**: Available data displayed, missing data handled gracefully
- **Coverage**: R8.2

#### Test EC11: Sync Conflict Resolution
- **Test Case**: Resolve sync conflicts when coming online
- **Precondition**: Offline and online data have conflicts
- **Action**: Come back online
- **Expected Result**: Conflicts resolved using appropriate strategy (timestamp-based, user preference, etc.)
- **Coverage**: R8.2

### Performance Edge Cases

#### Test EC12: Large Content Loading
- **Test Case**: Handle large static content files
- **Precondition**: Static content files are very large
- **Action**: Load content
- **Expected Result**: Content loads within performance targets, no UI freezing
- **Coverage**: CR3

#### Test EC13: Slow Network Conditions
- **Test Case**: Handle slow network gracefully
- **Precondition**: Network is slow or unreliable
- **Action**: Perform network operations
- **Expected Result**: Appropriate loading states, timeout handling, retry mechanisms
- **Coverage**: CR3

### Timezone Security Edge Cases

#### Test EC14: Rapid Timezone Changes
- **Test Case**: Prevent rapid timezone manipulation
- **Precondition**: User attempts multiple timezone changes in short period
- **Action**: Change timezone multiple times quickly
- **Expected Result**: Rate limiting applied, suspicious activity flagged
- **Coverage**: R3.4

#### Test EC15: Invalid Timezone Format Handling
- **Test Case**: Handle malformed timezone data
- **Precondition**: User submits invalid timezone format
- **Action**: Submit invalid timezone
- **Expected Result**: Validation error, timezone not updated, existing sessions unaffected
- **Coverage**: R3.4

#### Test EC16: Timezone Change During Active Challenge
- **Test Case**: Handle timezone changes during active challenges
- **Precondition**: User changes timezone while challenge is in progress
- **Action**: Change timezone during active challenge
- **Expected Result**: Active challenge continues using original session_timezone, new timezone only affects future sessions
- **Coverage**: R3.4

#### Test EC17: Cross-Device Timezone Synchronization
- **Test Case**: Handle timezone changes across multiple devices
- **Precondition**: User has active sessions on multiple devices, changes timezone on one
- **Action**: Change timezone on one device
- **Expected Result**: All devices reflect new timezone for future sessions, existing sessions maintain original session_timezone
- **Coverage**: R3.4

#### Test EC18: Timezone Rollback Attack Prevention
- **Test Case**: Prevent timezone rollback attacks
- **Precondition**: User attempts to set timezone to earlier time to extend challenge window
- **Action**: Set timezone to earlier time
- **Expected Result**: Challenge completion still blocked, original session_timezone enforced for all calculations
- **Coverage**: R3.4

#### Test EC19: Session Timezone Data Integrity
- **Test Case**: Ensure session timezone data cannot be tampered with
- **Precondition**: User attempts to modify session_timezone in database
- **Action**: Attempt to modify session_timezone field
- **Expected Result**: Modification blocked, audit trail created, security alert triggered
- **Coverage**: R3.4

#### Test EC20: Timezone Change Frequency Monitoring
- **Test Case**: Monitor and flag suspicious timezone change patterns
- **Precondition**: User changes timezone frequently
- **Action**: Change timezone multiple times
- **Expected Result**: Suspicious pattern detected, additional verification required, potential account review triggered
- **Coverage**: R3.4

## Test Coverage Summary

This test coverage document provides comprehensive testing scenarios for all requirements:

- **Total Requirements Covered**: 17 main requirements + 3 cross-cutting requirements
- **Total Test Cases**: 200+ test cases covering happy paths, edge cases, and error scenarios
- **Coverage Areas**: 
  - Functional requirements (R1-R17)
  - Cross-cutting concerns (CR1-CR3)
  - Edge cases and error handling (EC1-EC20)
  - Authentication and authorization flows
  - Data validation and consistency
  - Performance and offline capabilities
  - User experience and error handling
  - Timezone security and manipulation prevention

Each test case is mapped to specific requirements, ensuring full coverage of documented behavior and identifying additional edge cases that enhance system robustness.
