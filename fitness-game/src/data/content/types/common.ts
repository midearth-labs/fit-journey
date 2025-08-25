// Common type definitions for content management

export interface BaseContent {
  id: string;
  created_at: string;
  updated_at?: string;
}

export interface UnlockCondition {
  type: 'streak' | 'questions' | 'score' | 'habits' | 'perfect_days';
  value: number;
  streak_type?: string;
  content_category_id?: string;
  additional_conditions?: Record<string, any>;
}

export interface LearnMoreLink {
  type: 'youtube_short' | 'blog' | 'article' | 'video' | 'podcast';
  url: string;
  title: string;
  description?: string;
  duration?: string;
}

export interface ContentTag {
  id: string;
  name: string;
  category: string;
  description?: string;
}

export interface ContentMetadata {
  version: string;
  generated_at: string;
  generator_version: string;
  review_status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  reviewed_at?: string;
  quality_score?: number;
  difficulty_rating?: number;
}

export interface ContentRelationship {
  source_id: string;
  source_type: string;
  target_id: string;
  target_type: string;
  relationship_type: 'references' | 'depends_on' | 'related_to' | 'prerequisite_for';
  strength: 'weak' | 'medium' | 'strong';
}

export interface ContentValidationRule {
  id: string;
  name: string;
  description: string;
  rule_type: 'schema' | 'business' | 'cross_reference' | 'integrity';
  validation_function: string;
  error_message: string;
  severity: 'warning' | 'error' | 'critical';
  is_active: boolean;
}
