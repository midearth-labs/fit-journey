# Fitness Game - Entity Models

## Core User & Auth

### User
#### This table will be seeded from SupaBase's Auth table using a trigger, see https://supabase.com/docs/guides/auth/managing-user-data
```json
{
  id: string,
  email: string,
  created_at: timestamp,
  updated_at: timestamp,
}
```

### UserProfile
```json
 // TODO for requirements for current_avatar_id, current_streak_ids, longest_streak_ids
{
  id: string,
  user_id: string, // FK to User
  display_name: string?,
  current_avatar_id: string, // FK to AvatarAsset
  current_streak_ids: object, // { workout_completed: "foo", ate_clean: "bar", slept_well: "scxcx", hydrated: "baz", quiz_completed: "abc", } // each value is a FK to StreakHistory
  longest_streak_ids: number, // { workout_completed: "foo", ate_clean: "bar", slept_well: "scxcx", hydrated: "baz", quiz_completed: "abc", } // each value is a FK to StreakHistory
  last_activity_date: date, // default to date of registration
  created_at: timestamp,
  updated_at: timestamp,
}
```

## Content Management
#### these static content be stored in the repository as json files, committed to git and not to be modelled as SQL tables
### GameType
```json
{
  id: string,
  name: string, // "Equipment Identification", "Form Check", etc.
  slug: string, // "equipment", "form", "nutrition"
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
  game_type_id: string, // FK to GameType
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
  game_type_id: string, // FK to GameType
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

## Avatar System
#### these static content be stored in the repository as json files, committed to git and not to be modelled as SQL tables
### AvatarAsset
```json
{
  id: string,
  category: string, // "young-male", "old-female", "teen-nonbinary"
  state: string, // "fit-healthy", "muscular-strong", "lean-injured"
  image_url: string,
  unlock_condition: object, // {type: "streak", value: 7} or {type: "coins", value: 100}
  sort_order: number,
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
  game_type: string, // FK to GameType
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
  challenge_id: string, // FK to DailyChallenge if applicable
  started_at: timestamp,
  completed_at: timestamp?,
  is_completed: boolean,
  total_questions: number,
  correct_answers: number,
  time_spent_seconds: number?,
  // TODO attempt_count: number
}
```

### QuestionAttempt
```json
{
  id: string,
  game_session_id: string, // FK to GameSession
  question_id: string, // FK to Question
  selected_answer_index: number,
  is_correct: boolean,
  time_spent_seconds: number,
  answered_at: timestamp,
  hint_used: boolean, // default false
}
```

## Habit Tracking

### StreakLog
 // TODO for requirements
```json
{
  id: string,
  user_id: string, // FK to User
  date: date, // YYYY-MM-DD
  entries: object // { workout_completed: true, ate_clean: false, slept_well: true, hydrated: true, quiz_completed: true, }
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
  streak_type: string, // "workout_completed", "ate_clean", "slept_well", "hydrated", "quiz_completed", "all"
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
  reward_avatar_asset_id: string?, // FK to AvatarAsset
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

### UserAvatarHistory
```json
{
  id: string,
  user_id: string, // FK to User
  avatar_id: string, // FK to AvatarAsset
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