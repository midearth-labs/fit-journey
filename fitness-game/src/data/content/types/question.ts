// Question type definition
// Based on entities.md Question entity

import { BaseContent, ContentTag } from './common';

export type Question = BaseContent & {
  content_category_id: string;
  knowledge_base_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'passage_based' | 'true_false';
  options: string[];
  correct_answer_index: number;
  explanation: string;
  hints: string[];
  difficulty_level: number; // 1-5 scale
  image_url?: string;
  passage_set_id?: string; // FK to PassageSet (null for standalone questions)
  is_standalone: boolean; // true for standalone, false for passage-based
  tags: string[];
  
  // Extended fields for content management
  related_questions?: string[]; // IDs of related questions
  learning_objectives?: string[];
  common_misconceptions?: string[];
  expert_tips?: string[];
  difficulty_justification?: string; // Why this question has this difficulty level
  content_quality_score?: number;
  last_reviewed?: string;
  review_notes?: string;
}
