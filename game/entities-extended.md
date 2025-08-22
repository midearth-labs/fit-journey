# FitJourney Game - Entity Models



## Database Schema Design

## Core User & Auth

### User
```json
{
  // Extensible for Phase 2/3
  subscription_status: string?, // null, "premium", "cancelled"
  subscription_expires_at: timestamp?,
}
```

### UserProfile
```json
{
  // Extensible for Phase 2/3
  total_coins: number, // default 0
  expertise_level: string?, // "beginner", "intermediate", "advanced"
  specialization_track: string?, // "powerlifting", "bodybuilding", "general"
  streak_freezes_remaining: number?, // default 1 for premium users
  total_questions_answered: number? // default 0
}
```

## Content Management

### GameType
```json
{
  // Extensible for Phase 2/3
  difficulty_range: object?, // {min: 1, max: 5}
  estimated_time_minutes: number?, // average completion time
  prerequisite_game_types: Array<string>? // must complete these first
}
```

### Question
```json
{
  // Extensible for Phase 2/3
  spaced_repetition_interval: number?, // days before re-asking
  success_rate: number?, // global success percentage
  average_time_seconds: number? // analytics data
}
```

### PassageSet
```json
{
  // Extensible for Phase 2/3
  prerequisite_passages: Array<string>?,
  specialization_track: string? // "powerlifting", "bodybuilding", etc.
}
```

## Avatar System

### AvatarAsset
```json
{
  // Extensible for Phase 2/3
  rarity: string?, // "common", "rare", "epic", "legendary"
  animation_url: string?, // for animated avatars
  is_premium_only: boolean?, // default false
  seasonal_availability: object? // {start_date: "2024-06-01", end_date: "2024-08-31"}
}
```

## Game Sessions & Progress

### DailyChallenge
```json
{
  // Extensible for Phase 2/3
  bonus_coins: number, // default 0 for special days
  difficulty_modifier: number?, // 1.0 = normal, 1.5 = harder
  global_participation_target: number?, // for community challenges
  special_rewards: Array<object>? // [{type: "avatar", asset_id: "..."}]
}
```

### GameSession
```json
{
  // Extensible for Phase 2/3
  coins_earned: number,
  streak_day: number?, // which day of streak this represents
  difficulty_level_played: number?,
  bonus_multiplier: number? // for weekends, special events
}
```

### QuestionAttempt
```json
{
  // Extensible for Phase 2/3
  confidence_level: number?, // 1-5 user-reported confidence
  difficulty_perceived: number? // 1-5 user-reported difficulty
}
```

## Habit Tracking

### StreakLog
```json
{=
  // Extensible for Phase 2/3
  coins_earned_habits: number, // default 0
  workout_type: string?, // "strength", "cardio", "flexibility"
  workout_duration_minutes: number?,
  meal_quality_rating: number?, // 1-5 scale
  sleep_hours: number?,
  water_intake_completed: boolean?, // default false
  external_tracker_synced: boolean? // fitness app integration
}
```

## Streaks & Achievements

### StreakHistory
```json
{
  // Extensible for Phase 2/3
  freeze_used: boolean?, // default false
  max_difficulty_reached: number?,
  total_coins_earned: number?
}
```

### Achievement
```json
{
  // Extensible for Phase 2/3
  reward_coins: number,
  rarity: string?, // "common", "rare", "epic"
  is_seasonal: boolean?, // default false
  prerequisite_achievements: Array<string>? // must unlock these first
}
```

### UserAchievement
```json
{
  // Extensible for Phase 2/3
  progress_value: number?, // for multi-step achievements
  shared_socially: boolean? // default false
}
```

## Social Features (Extensible)

### FriendRequest
```json
{
  id: string,
  requester_user_id: string, // FK to User
  requested_user_id: string, // FK to User
  status: string, // "pending", "accepted", "declined"
  created_at: timestamp,
  responded_at: timestamp?,
  // Phase 2/3 only
  request_method: string? // "username", "email", "qr_code"
}
```

### WeeklyLeaderboard
```json
{
  id: string,
  week_start_date: date, // Monday of the week
  leaderboard_type: string, // "global", "friends", "local"
  user_rankings: Array<object>, // [{user_id: string, score: number, rank: number}]
  created_at: timestamp,
  // Phase 2/3 only
  geographic_filter: string?, // "city", "state", "country"
  friend_group_id: string? // FK to FriendGroup
}
```

## Notifications

### NotificationQueue
```json
{
  id: string,
  user_id: string, // FK to User
  notification_type: string, // "daily_reminder", "streak_danger", "achievement"
  title: string,
  message: string,
  scheduled_for: timestamp,
  sent_at: timestamp?,
  opened_at: timestamp?,
  action_url: string?, // deep link for specific action
  is_sent: boolean, // default false
  // Extensible for Phase 2/3
  priority_level: string?, // "low", "medium", "high", "urgent"
  personalization_data: object?, // for dynamic message content
  a_b_test_variant: string? // for testing notification effectiveness
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