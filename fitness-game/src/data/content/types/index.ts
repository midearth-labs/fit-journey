// Content Management System Type Definitions
// Based on entities.md and requirements.md

import { ContentCategory } from './content-category';
import { Question } from './question';
import { KnowledgeBase } from './knowledge-base';
import { PassageSet } from './passage-set';
import { StreakType } from './streak-type';
import { UserState } from './user-state';
import { AvatarAsset } from './avatar-asset';
import { Achievement } from './achievement';
import { DailyChallenge } from './daily-challenge';

export * from './common';
export * from './content-category';
export * from './daily-challenge';
export * from './knowledge-base';
export * from './passage-set';
export * from './question';
export * from './streak-type';
export * from './user-state';

// Content type union for type safety
export type ContentType = 
  | 'ContentCategory'
  | 'Question'
  | 'KnowledgeBase'
  | 'PassageSet'
  | 'StreakType'
  | 'UserState'
  | 'AvatarAsset'
  | 'Achievement'
  | 'DailyChallenge';

// Content maps for efficient retrieval
export type ContentMaps = {
  ContentCategory: Map<string, ContentCategory>;
  Question: Map<string, Question>;
  KnowledgeBase: Map<string, KnowledgeBase>;
  PassageSet: Map<string, PassageSet>;
  StreakType: Map<string, StreakType>;
  UserState: Map<string, UserState>;
  AvatarAsset: Map<string, AvatarAsset>;
  Achievement: Map<string, Achievement>;
  DailyChallenge: Map<string, DailyChallenge>;
};

// Content loading options
export interface LoadOptions {
  categoryId?: string;
  difficultyLevel?: number;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

// Content validation result
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  summary: ValidationSummary;
}

export interface ValidationError {
  entityType: string;
  entityId: string;
  field: string;
  message: string;
  severity: 'error' | 'critical';
}

export interface ValidationWarning {
  entityType: string;
  entityId: string;
  field: string;
  message: string;
  suggestion?: string;
}

export interface ValidationSummary {
  totalEntities: number;
  validEntities: number;
  errorCount: number;
  warningCount: number;
  criticalErrors: number;
}
