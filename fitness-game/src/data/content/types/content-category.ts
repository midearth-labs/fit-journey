// ContentCategory type definition
// Based on entities.md ContentCategory entity

import { BaseContent, ContentMetadata, ContentTag } from './common';

export interface ContentCategory extends BaseContent {
  id: string;
  name: string;
  description: string;
  icon_name: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  
  // Extended fields for content management
  metadata?: ContentMetadata;
  tags?: ContentTag[];
  related_categories?: string[]; // IDs of related categories
  question_count?: number;
  passage_count?: number;
  knowledge_base_count?: number;
  estimated_completion_time_minutes?: number;
  difficulty_range?: {
    min: number;
    max: number;
    average: number;
  };
  learning_objectives?: string[];
  prerequisites?: string[]; // IDs of prerequisite categories
  target_audience?: 'beginner' | 'intermediate' | 'advanced' | 'all';
  content_theme?: string;
  last_updated?: string;
  update_frequency?: 'weekly' | 'monthly' | 'quarterly' | 'as_needed';
}
