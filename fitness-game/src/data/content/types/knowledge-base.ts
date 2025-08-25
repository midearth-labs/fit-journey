// KnowledgeBase type definition
// Based on entities.md KnowledgeBase entity

import { BaseContent, ContentMetadata, LearnMoreLink, ContentTag } from './common';

export interface KnowledgeBase extends BaseContent {
  id: string;
  content_category_id: string;
  title: string;
  description: string; // markdown content
  tags: string[];
  related_knowledge_base_ids: string[];
  learn_more_links: LearnMoreLink[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  
  // Extended fields for content management
  metadata?: ContentMetadata;
  content_tags?: ContentTag[];
  content_format?: 'article' | 'tutorial' | 'guide' | 'reference' | 'case_study';
  reading_level?: 'beginner' | 'intermediate' | 'advanced';
  estimated_read_time_minutes?: number;
  word_count?: number;
  key_takeaways?: string[];
  prerequisites?: string[]; // IDs of prerequisite knowledge base articles
  learning_outcomes?: string[];
  content_structure?: {
    sections: {
      title: string;
      content: string;
      order: number;
    }[];
    summary?: string;
    conclusion?: string;
  };
  visual_aids?: {
    images: string[];
    diagrams: string[];
    videos: string[];
    infographics: string[];
  };
  interactive_elements?: {
    quizzes: string[]; // Question IDs
    exercises: string[];
    checklists: string[];
  };
  expert_contributors?: {
    name: string;
    credentials: string;
    contribution: string;
  }[];
  last_updated?: string;
  update_frequency?: 'monthly' | 'quarterly' | 'biannually' | 'annually';
  content_quality_score?: number;
  user_feedback?: {
    helpful_count: number;
    not_helpful_count: number;
    average_rating: number;
    review_count: number;
  };
}
