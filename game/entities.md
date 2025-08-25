# FitJourney Game - Entity Models

## Core User & Auth

### User
#### This table will be seeded from SupaBase's Auth table using a trigger, see https://supabase.com/docs/guides/auth/managing-user-data
```json
{
  id: string,
  email: string,
  display_name: string?,
  avatar_gender: string?, // male, female
  avatar_age_range: string?, // child (5-12), teen (13-19), young-adult (20-39), middle-age (40-59), senior (60+)
  timezone: string?, // e.g. UTC, UTC+1, UTC-8
  preferred_reminder_time: string?, //  e.g. "19:00"
  notification_preferences: object? // {daily: true, social: false, achievements: true}
  created_at: timestamp,
  updated_at: timestamp,
}
```

### UserProfile
```json
{
  id: string,
  user_id: string, // FK to User
  latest_game_session: string? // FK to GameSession
  current_state: string? // FK to UserStateHistory
  current_streak_ids: object?, // { workout_completed: "foo", ate_clean: "bar", slept_well: "scxcx", hydrated: "baz", quiz_completed: "abc", quiz_passed: "abc", } // each value is a FK to StreakHistory
  longest_streaks: object?, // { workout_completed: "foo", ate_clean: "bar", slept_well: "scxcx", hydrated: "baz", quiz_completed: "abc", quiz_passed: "abc", } // each value is a FK to StreakHistory
  last_activity_date: date?, // update this based on completion of daily quiz or logging of habits 
  created_at: timestamp,
  updated_at: timestamp,
}
```

## Content Management
#### these static content be stored in the repository as json files, committed to git and not to be modelled as SQL tables
### ContentCategory
```json
{
  id: string,  // "equipment", "form", "nutrition" etc
  name: string, // "Equipment Identification", "Form Check", etc.
  description: string,
  icon_name: string, // for UI icons
  is_active: boolean, // default true
  sort_order: number, // for display ordering
  created_at: timestamp,
}
```

### Question
#### these static content be stored in the repository as json files, committed to git and not to be modelled as SQL tables
```json
{
  id: string,
  content_category_id: string, // FK to ContentCategory
  knowledge_base_id: string, // FK to KnowledgeBase
  question_text: string,
  question_type: string, // "multiple_choice", "passage_based", "true_false"
  options: Array<string>, // ["Option A", "Option B", "Option C", "Option D"]
  correct_answer_index: number, // 0-based index
  explanation: string,
  hints: Array<string>,
  difficulty_level: number, // 1-5 scale
  image_url: string?,
  passage_set_id: string?, // FK to PassageSet (null for standalone questions)
  is_standalone: boolean, // true for standalone, false for passage-based
  is_active: boolean, // default true
  created_at: timestamp,
  updated_at: timestamp,
  tags: Array<string>, // ["squats", "form", "beginner"]
}
```

### KnowledgeBase
#### these static content be stored in the repository as json files, committed to git and not to be modelled as SQL tables
```json
{
  id: string,
  content_category_id: string, // FK to ContentCategory
  title: string,
  description: string, // markdown content
  tags: Array<string>, // ["squats", "form", "beginner", "legs", "nutrition", "recovery"]
  related_knowledge_base_ids: Array<string>, // FK to KnowledgeBase
  learn_more_links: Array<object>, // [{type: "youtube_short", url: "https://...", title: "..."}, {type: "blog", url: "https://...", title: "..."}]
  is_active: boolean, // default true
  sort_order: number, // for display ordering
  created_at: timestamp,
  updated_at: timestamp,
}
```

### PassageSet
#### these static content be stored in the repository as json files, committed to git and not to be modelled as SQL tables
```json
{
  id: string,
  content_category_id: string, // FK to ContentCategory
  title: string,
  passage_text: string,
  difficulty_level: number, // 1-5 scale
  estimated_read_time_minutes: number,
  question_count: number, // Number of associated questions
  is_active: boolean,
  created_at: timestamp,
  updated_at: timestamp,
  tags: Array<string>, 
}
```

### StreakType
#### these static content be stored in the repository as json files, committed to git and not to be modelled as SQL tables
// Streak Type Keys and Titles:
// workout_completed = "Daily Workout"
// ate_clean = "Clean Eating"
// slept_well = "Quality Sleep" 
// hydrated = "Hydration Goal"
// quiz_completed = "Daily Quiz Completed"
// quiz_passed = "Daily Quiz Passed"
// all = "Perfect Day"
```json
{
  id: string, // "workout_completed", "ate_clean", "slept_well", "hydrated", "quiz_completed", "quiz_passed", "all"
  title: string,
  description: string,
  sort_order: number, // for display ordering
  created_at: timestamp,
}
```


## Avatar System
#### these static content be stored in the repository as json files, committed to git and not to be modelled as SQL tables
### UserState
```json
{
  id: string,  // "average" "fit-healthy", "muscular-strong", "lean-injured"
  unlock_condition: object, // {type: "streak", value: 7} or {type: "coins", value: 100}
  eval_order: number,
  created_at: timestamp,
  updated_at: timestamp,
}
```

#### these static content be stored in the repository as json files, committed to git and not to be modelled as SQL tables
### AvatarAsset
```json
{
  id: string,
  state_id: string, // FK to UserState
  gender: string,
  age_range: string,
  image_url: string,
  created_at: timestamp,
  updated_at: timestamp,
}
```

## Game Sessions & Progress

### DailyChallenge (Static Content)
#### these static content be stored in the repository as json files, committed to git and not to be modelled as SQL tables
```json
{
  id: string,
  content_category_id: string, // FK to ContentCategory
  day: number, // 1, 2, 3, ..., till challenge ends
  challenge_structure: Array<object>, // [{type: "standalone", question_id: "q1"}, {type: "passage", passage_set_id: "p1", question_ids: ["q2", "q3", "q4"]}, {type: "standalone", question_id: "q5"}]
  total_questions: number,
  theme: string?, // "Muscle Monday", "Technique Tuesday"
  created_at: timestamp,
  updated_at: timestamp,
}
```

### GameSession
```json
{
  id: string,
  user_id: string, // FK to User
  challenge_id: string, // FK to DailyChallenge.id
  session_timezone: string, // NEW: Store timezone when session starts e.g. UTC-7
  session_date_utc: date, // The UTC date of when the session was first started.
  started_at: timestamp,
  completed_at: timestamp?,
  in_progress: boolean?, // true by default, set to null when session is complete, or day is over.
  user_answers: Array<object>?, // Array of { question_id: string, answer_index: number, is_correct: boolean, hint_used: boolean,}
  all_correct_answers: boolean?, // Whether all questions were asnwered correctly.
  time_spent_seconds: number?,
  attempt_count: number, // default: 1. If at a submission, a user doesn't answer all questions correctly, they can try again up to 3 times before the current day ends.
}
```

## Habit Tracking

### StreakLog
```json
{
  id: string,
  user_id: string, // FK to User
  date_utc: date, // YYYY-MM-DD
  entries: object // { workout_completed: true, ate_clean: false, slept_well: true, hydrated: true, quiz_completed: true, quiz_passed: true, }
  logged_at: timestamp,
}
```

## Streaks & Achievements

### StreakHistory
```json
{
  id: string,
  user_id: string, // FK to User
  streak_length: number,
  started_date: date,
  ended_date: date?, // null if current streak
  streak_type: string, // FK to StreakType
  created_at: timestamp,
}
```


### Achievement
#### these static content be stored in the repository as json files, committed to git and not to be modelled as SQL tables
```json
{
  id: string,
  name: string,
  description: string,
  icon_name: string,
  unlock_condition: object, // {type: "streak", value: 30} or {type: "questions", value: 100}
  is_hidden: boolean, // default false (for surprise achievements)
  category: string?, // "streaks", "knowledge", "social", "habits"
  created_at: timestamp,
}
```

### UserAchievement
```json
{
  id: string,
  user_id: string, // FK to User
  achievement_id: string, // FK to Achievement
  unlocked_at: timestamp,
}

### UserStateHistory
```json
{
  id: string,
  user_id: string, // FK to User
  state_id: string, // FK to UserState
  unlocked_at: timestamp,
}
```


## Extensibility Notes

- **Foreign Key relationships** are indicated with comments but not enforced in JSON
- **Optional fields** are marked with `?` and will be null/undefined in Phase 1
- **Enums** are represented as strings but should be validated at application level
- **Objects and Arrays** allow for complex data storage without additional tables
- **Timestamp fields** should be UTC and handle timezone conversion at application level
- **Boolean fields** default to false unless specified
- **ID fields** should be UUIDs for global uniqueness and security