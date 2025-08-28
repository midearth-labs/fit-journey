// PassageSet type definition
// Based on entities.md PassageSet entity

import { BaseContent, ContentTag } from './common';

export interface PassageSet extends BaseContent {
  id: string;
  content_category_id: string;
  title: string;
  passage_text: string;
  difficulty_level: number; // 1-5 scale
  estimated_read_time_minutes: number;
  question_count: number; // Number of associated questions
  is_active: boolean;
  created_at: string;
  updated_at: string;
  tags: string[];
  
  // Extended fields for content management
  content_tags?: ContentTag[];
  passage_type?: 'article' | 'story' | 'case_study' | 'research_summary' | 'expert_interview';
  reading_complexity?: 'elementary' | 'middle_school' | 'high_school' | 'college' | 'professional';
  vocabulary_level?: 'basic' | 'intermediate' | 'advanced' | 'expert';
  content_themes?: string[];
  key_concepts?: string[];
  learning_objectives?: string[];
  passage_structure?: {
    introduction?: string;
    main_content: string;
    conclusion?: string;
    call_to_action?: string;
  };
  visual_elements?: {
    images: string[];
    diagrams: string[];
    charts: string[];
    tables: string[];
  };
  related_content?: {
    knowledge_base_articles: string[];
    related_passages: string[];
    prerequisite_passages: string[];
    follow_up_passages: string[];
  };
  accessibility_features?: {
    has_audio_version?: boolean;
    supports_screen_readers: boolean;
    has_summary?: boolean;
    has_key_points?: boolean;
  };
  content_quality_metrics?: {
    readability_score: number;
    coherence_score: number;
    engagement_score: number;
    educational_value_score: number;
  };
  last_reviewed?: string;
  review_notes?: string;
  update_recommendations?: string[];
}
