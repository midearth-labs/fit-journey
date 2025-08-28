// DailyChallenge type definition
// Based on entities.md DailyChallenge entity

import { BaseContent } from './common';

export interface DailyChallenge extends BaseContent {
  id: string;
  content_category_id: string; // FK to ContentCategory
  day: number; // 1, 2, 3, ..., till challenge ends
  challenge_structure: ChallengeStructure[];
  total_questions: number;
  theme?: string; // "Muscle Monday", "Technique Tuesday"
  created_at: string;
  updated_at: string;
  
  // Extended fields for content management
  challenge_type?: 'daily' | 'weekly' | 'special' | 'seasonal' | 'event_based';
  challenge_difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  challenge_duration?: {
    estimated_completion_time_minutes: number;
    time_limit_minutes?: number;
    available_hours: {
      start: string; // "00:00"
      end: string; // "23:59"
    };
  };
  challenge_structure_details?: {
    standalone_questions: number;
    passage_based_questions: number;
    difficulty_distribution: {
      easy: number; // Should be 3
      medium: number; // Should be 4
      hard: number; // Should be 3
    };
    question_sequence: QuestionSequence[];
  };
  challenge_theme_details?: {
    primary_theme: string;
    secondary_themes: string[];
    motivational_message: string;
    theme_description: string;
    visual_elements: string[];
  };
  challenge_learning_objectives?: {
    primary_objectives: string[];
    secondary_objectives: string[];
    skill_focus: string[];
    knowledge_areas: string[];
  };
  challenge_progression?: {
    prerequisite_challenges?: string[]; // Previous challenge IDs
    next_challenge_id?: string;
    progression_requirements: string[];
    difficulty_curve: 'linear' | 'exponential' | 'step_function' | 'adaptive';
  };
  challenge_rewards?: {
    experience_points: number;
    streak_bonus: number;
    special_achievements: string[];
    unlock_content: string[];
    social_recognition: string[];
  };
  challenge_analytics?: {
    completion_rate: number;
    average_score: number;
    average_completion_time: number;
    difficulty_rating: number;
    user_feedback_score: number;
  };
  challenge_accessibility?: {
    alternative_formats: string[];
    audio_support: boolean;
    visual_aids: boolean;
    simplified_versions: boolean;
    accessibility_features: string[];
  };
  challenge_social?: {
    can_share: boolean;
    leaderboard_enabled: boolean;
    community_discussion: boolean;
    social_challenges: boolean;
    team_challenges: boolean;
  };
  challenge_content?: {
    related_knowledge: string[]; // KnowledgeBase IDs
    additional_resources: string[];
    study_materials: string[];
    practice_exercises: string[];
  };
  challenge_validation?: {
    question_validation_rules: string[];
    answer_validation_rules: string[];
    time_validation_rules: string[];
    integrity_checks: string[];
  };
}

export interface ChallengeStructure {
  type: 'standalone' | 'passage';
  question_id?: string; // For standalone questions
  passage_set_id?: string; // For passage-based questions
  question_ids?: string[]; // For passage-based questions
  order: number;
  estimated_time_seconds: number;
  difficulty_level: number;
  points_value: number;
}

export interface QuestionSequence {
  position: number;
  question_type: 'standalone' | 'passage';
  question_id?: string;
  passage_set_id?: string;
  transition_message?: string;
  visual_separator?: boolean;
}
