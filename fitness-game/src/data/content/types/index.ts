// Content Management System Type Definitions
// Based on entities.md and requirements.md

import { z } from 'zod';
import { ContentCategory, ContentCategorySchema } from './content-category';
import { Question, QuestionSchema } from './question';
import { KnowledgeBase, KnowledgeBaseSchema } from './knowledge-base';
import { PassageSet, PassageSetSchema } from './passage-set';
import { StreakType, StreakTypeSchema } from './streak-type';
import { AvatarAsset, AvatarAssetSchema } from './avatar-asset';
import { DailyChallenge, DailyChallengeSchema } from './daily-challenge';

export * from './common';
export * from './content-category';
export * from './daily-challenge';
export * from './knowledge-base';
export * from './passage-set';
export * from './question';
export * from './streak-type';
export * from './avatar-asset';

// Content type union for type safety
export type ContentType = 
  | 'ContentCategory'
  | 'Question'
  | 'KnowledgeBase'
  | 'PassageSet'
  | 'StreakType'
  | 'AvatarAsset'
  | 'DailyChallenge';

// Content maps for efficient retrieval
export type Content = {
  ContentCategory: MapAndList<ContentCategory>;
  Question: MapAndList<Question>;
  KnowledgeBase: MapAndList<KnowledgeBase>;
  PassageSet: MapAndList<PassageSet>;
  StreakType: MapAndList<StreakType>;
  AvatarAsset: MapAndList<AvatarAsset>;
  DailyChallenge: MapAndList<DailyChallenge>;
};

// Mapping from ContentType to Zod schema for runtime validation
export const ContentTypeToSchema = {
  ContentCategory: ContentCategorySchema,
  Question: QuestionSchema,
  KnowledgeBase: KnowledgeBaseSchema,
  PassageSet: PassageSetSchema,
  StreakType: StreakTypeSchema,
  AvatarAsset: AvatarAssetSchema,
  DailyChallenge: DailyChallengeSchema,
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

export type ValidationSummary = {
  totalEntities: number;
  countsByType: Record<ContentType, number>;
  validEntities: number;
  errorCount: number;
  warningCount: number;
  criticalErrors: number;
}
