// Content Management System Type Definitions
// Based on entities.md and requirements.md

import { z } from 'zod';
import { ContentType } from './constants';
import { ContentCategory, ContentCategorySchema } from './content-category';
import { Question, QuestionSchema } from './question';
import { KnowledgeBase, KnowledgeBaseSchema } from './knowledge-base';
import { StreakType, StreakTypeSchema } from './streak-type';
import { AvatarAsset, AvatarAssetSchema } from './avatar-asset';
import { Challenge, ChallengeSchema } from './challenge';

export * from './common';
export * from './content-category';
export * from './knowledge-base';
export * from './question';
export * from './streak-type';
export * from './avatar-asset';

// Content maps for efficient retrieval
export type Content = {
  ContentCategory: MapAndList<ContentCategory>;
  Question: MapAndList<Question>;
  KnowledgeBase: MapAndList<KnowledgeBase>;
  StreakType: MapAndList<StreakType>;
  AvatarAsset: MapAndList<AvatarAsset>;
  Challenge: MapAndList<Challenge>;
};

// Mapping from ContentType to Zod schema for runtime validation
export const ContentTypeToSchema = {
  ContentCategory: ContentCategorySchema,
  Question: QuestionSchema,
  KnowledgeBase: KnowledgeBaseSchema,
  StreakType: StreakTypeSchema,
  AvatarAsset: AvatarAssetSchema,
  Challenge: ChallengeSchema,
} as const satisfies Record<keyof Content, z.ZodSchema<any>>;

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
