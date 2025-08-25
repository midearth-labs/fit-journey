// StreakType type definition
// Based on entities.md StreakType entity

import { BaseContent, ContentMetadata } from './common';

export interface StreakType extends BaseContent {
  id: string; // "workout_completed", "ate_clean", "slept_well", "hydrated", "quiz_completed", "quiz_passed", "all"
  title: string;
  description: string;
  sort_order: number;
  created_at: string;
  
  // Extended fields for content management
  metadata?: ContentMetadata;
  streak_category?: 'physical' | 'nutrition' | 'wellness' | 'knowledge' | 'composite';
  measurement_unit?: 'days' | 'weeks' | 'months' | 'sessions' | 'completions';
  target_frequency?: 'daily' | 'weekly' | 'monthly' | 'custom';
  difficulty_level?: 'easy' | 'medium' | 'hard' | 'expert';
  health_benefits?: string[];
  motivational_messages?: {
    short: string;
    medium: string;
    long: string;
  };
  streak_milestones?: {
    days: number;
    title: string;
    description: string;
    reward?: string;
  }[];
  related_streak_types?: string[]; // IDs of related streak types
  prerequisites?: string[]; // IDs of prerequisite streak types
  max_streak_days?: number; // Maximum achievable streak (null for unlimited)
  streak_decay_rules?: {
    grace_period_days: number;
    decay_rate: number; // How much streak decreases per missed day
    recovery_multiplier: number; // How much faster streak recovers
  };
  streak_validation_rules?: {
    requires_verification: boolean;
    verification_method?: 'manual' | 'automatic' | 'hybrid';
    cooldown_period_hours?: number;
    max_attempts_per_day?: number;
  };
  streak_analytics?: {
    average_streak_length: number;
    longest_recorded_streak: number;
    success_rate: number;
    user_engagement_score: number;
  };
  streak_challenges?: {
    challenge_id: string;
    title: string;
    description: string;
    streak_requirement: number;
    reward?: string;
  }[];
  streak_social_features?: {
    can_share: boolean;
    can_compare: boolean;
    leaderboard_enabled: boolean;
    community_challenges: boolean;
  };
}
