// Content Management System Type Definitions
// Based on entities.md and requirements.md

import { z } from 'zod';
import { type ContentType } from './constants';
import {  ContentCategorySchema } from './content-category';
import { type Question, QuestionSchema } from './question';
import { type KnowledgeBase, KnowledgeBaseSchema } from './knowledge-base';
import { type StreakType, StreakTypeSchema } from './streak-type';
import { type AvatarAsset, AvatarAssetSchema } from './avatar-asset';
import { type LearningPath, LearningPathSchema } from './learning-paths';
import { type PersonaQuestion, PersonaQuestionSchema } from './persona-question';

export * from './common';
export * from './content-category';
export * from './knowledge-base';
export * from './question';
export * from './streak-type';
export * from './avatar-asset';
export * from './learning-paths';
export * from './persona-question';

// Mapping from ContentType to Zod schema for runtime validation
export const ContentTypeToSchema = {
  ContentCategory: ContentCategorySchema,
  Question: QuestionSchema,
  KnowledgeBase: KnowledgeBaseSchema,
  // StreakType: StreakTypeSchema,
  // AvatarAsset: AvatarAssetSchema,
  //Challenge: ChallengeSchema,
  LearningPath: LearningPathSchema,
  PersonaQuestion: PersonaQuestionSchema,
} as const;
type ContentTypeToSchemaType = typeof ContentTypeToSchema;

// Content maps for efficient retrieval
export type Content = {
  [K in keyof ContentTypeToSchemaType]: MapAndList<z.infer<ContentTypeToSchemaType[K]>>
};


export type MapAndList<T> = {
  map: Map<string, T>;
  list: T[];
};

// Content validation result
export type ValidationResult = {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  summary: ValidationSummary;
};

export type ValidationError = {
  entityType: string;
  entityId: string;
  field: string;
  message: string;
  severity: 'error' | 'critical';
};

export type ValidationWarning = {
  entityType: string;
  entityId: string;
  field: string;
  message: string;
  suggestion?: string;
};

export type ValidationInfo = {
  entityType: string;
  entityId: string;
  field: string;
  message: string;
};

export type ValidationSummary = {
  totalEntities: number;
  countsByType: Record<ContentType, number>;
  validEntities: number;
  errorCount: number;
  warningCount: number;
  criticalErrors: number;
}
