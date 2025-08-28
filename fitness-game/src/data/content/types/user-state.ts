// UserState type definition
// Based on entities.md UserState entity

import { BaseContent, UnlockCondition } from './common';

export interface UserState extends BaseContent {
  id: string; // "average", "fit-healthy", "muscular-strong", "lean-injured", "injured-recovering"
  unlock_condition: UnlockCondition;
  eval_order: number; // Order for state progression evaluation
  created_at: string;
  updated_at: string;
  
  // Extended fields for content management
  state_category?: 'fitness' | 'health' | 'injury' | 'performance' | 'wellness';
  state_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'master';
  visual_representation?: {
    primary_color: string;
    secondary_color: string;
    icon_style: string;
    animation_type: string;
  };
  state_description?: {
    short: string;
    detailed: string;
    motivational: string;
  };
  state_characteristics?: {
    strength_level: number; // 1-10 scale
    endurance_level: number; // 1-10 scale
    flexibility_level: number; // 1-10 scale
    knowledge_level: number; // 1-10 scale
    wellness_score: number; // 1-10 scale
  };
  state_benefits?: {
    physical_benefits: string[];
    mental_benefits: string[];
    performance_benefits: string[];
    health_benefits: string[];
  };
  state_requirements?: {
    minimum_streak_days: number;
    minimum_quiz_score: number;
    minimum_habits_per_day: number;
    required_achievements: string[];
    minimum_activity_days: number;
  };
  state_progression?: {
    next_state_id?: string;
    progression_requirements: string[];
    progression_tips: string[];
    estimated_time_to_next: string;
  };
  state_regression?: {
    previous_state_id?: string;
    regression_triggers: string[];
    prevention_tips: string[];
    recovery_strategies: string[];
  };
  state_customization?: {
    customizable_avatar_features: string[];
    personalization_options: string[];
    theme_variations: string[];
  };
  state_analytics?: {
    average_time_in_state: number; // days
    progression_rate: number; // percentage
    regression_rate: number; // percentage
    user_satisfaction_score: number;
  };
  state_content?: {
    recommended_questions: string[]; // Question IDs
    recommended_passages: string[]; // Passage IDs
    recommended_knowledge: string[]; // KnowledgeBase IDs
    personalized_tips: string[];
  };
  state_social?: {
    can_share: boolean;
    community_visibility: 'public' | 'friends' | 'private';
    leaderboard_category?: string;
    social_challenges: boolean;
  };
}
