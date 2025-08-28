// Achievement type definition
// Based on entities.md Achievement entity

import { BaseContent, UnlockCondition } from './common';

export interface Achievement extends BaseContent {
  id: string;
  name: string;
  description: string;
  icon_name: string;
  unlock_condition: UnlockCondition;
  is_hidden: boolean; // default false (for surprise achievements)
  category?: string; // "streaks", "knowledge", "social", "habits"
  created_at: string;
  
  // Extended fields for content management
  achievement_tier?: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  difficulty_rating?: 'easy' | 'medium' | 'hard' | 'expert' | 'legendary';
  rarity_level?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  achievement_type?: 'milestone' | 'streak' | 'collection' | 'challenge' | 'social' | 'special';
  visual_representation?: {
    icon_url: string;
    badge_design: string;
    color_scheme: string;
    animation_effect: string;
  };
  achievement_progression?: {
    current_progress?: number;
    target_progress: number;
    progress_type: 'linear' | 'exponential' | 'milestone_based';
    progress_indicators: string[];
  };
  achievement_rewards?: {
    experience_points?: number;
    avatar_customizations?: string[];
    special_titles?: string[];
    unlock_content?: string[];
    social_recognition?: string[];
  };
  achievement_requirements?: {
    primary_condition: UnlockCondition;
    secondary_conditions?: UnlockCondition[];
    time_constraints?: {
      minimum_time_required?: string;
      maximum_time_allowed?: string;
      seasonal_availability?: string[];
    };
    prerequisite_achievements?: string[];
    co_requisite_achievements?: string[];
  };
  achievement_tracking?: {
    progress_visible: boolean;
    milestone_notifications: boolean;
    progress_sharing: boolean;
    leaderboard_inclusion: boolean;
  };
  achievement_social?: {
    can_share: boolean;
    social_announcement: string;
    community_visibility: 'public' | 'friends' | 'private';
    social_challenges: boolean;
  };
  achievement_analytics?: {
    unlock_rate: number; // percentage of users who have unlocked
    average_unlock_time: number; // days from start to unlock
    difficulty_score: number; // calculated difficulty based on user data
    user_satisfaction_score: number;
  };
  achievement_content?: {
    related_questions: string[]; // Question IDs
    related_knowledge: string[]; // KnowledgeBase IDs
    related_passages: string[]; // Passage IDs
    achievement_story: string;
    fun_facts: string[];
  };
  achievement_updates?: {
    version_history: string[];
    last_modified: string;
    update_notes: string[];
    future_plans: string[];
  };
  achievement_accessibility?: {
    alternative_descriptions: string[];
    audio_descriptions?: boolean;
    high_contrast_versions: boolean;
    simplified_explanations: string[];
  };
}
