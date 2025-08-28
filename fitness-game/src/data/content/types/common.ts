import { z } from 'zod';

// Common type definitions for content management

// Zod schemas
export const BaseContentSchema = z.object({
  id: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  is_active: z.boolean(),
  sort_order: z.number(),
});

export const UnlockConditionSchema = z.object({
  type: z.enum(['streak', 'questions', 'score', 'habits', 'perfect_days']),
  value: z.number(),
  streak_type: z.string().optional(),
  content_category_id: z.string().optional(),
  additional_conditions: z.record(z.string(), z.any()).optional(),
});

export const LearnMoreLinkSchema = z.object({
  type: z.enum(['youtube_short', 'blog', 'article', 'video', 'podcast', 'tiktok', 'ig_content', 'app_store', 'google_play']),
  url: z.string(),
  title: z.string(),
  description: z.string().optional(),
  duration: z.string().optional(),
});

export const AffiliateLinkSchema = z.object({
  type: z.enum(['amazon', 'gymshark']),
  url: z.string(),
  title: z.string(),
  description: z.string(),
});

export const ImageSchema = z.object({
  path: z.string(),
  description: z.string(),
  width: z.number(),
  height: z.number(),
  prompt_generation_string: z.string(),
});

export const ContentValidationRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  rule_type: z.enum(['schema', 'business', 'cross_reference', 'integrity']),
  validation_function: z.string(),
  error_message: z.string(),
  severity: z.enum(['warning', 'error', 'critical']),
  is_active: z.boolean(),
});

// Inferred types from Zod schemas
export type BaseContent = z.infer<typeof BaseContentSchema>;
export type UnlockCondition = z.infer<typeof UnlockConditionSchema>;
export type LearnMoreLink = z.infer<typeof LearnMoreLinkSchema>;
export type AffiliateLink = z.infer<typeof AffiliateLinkSchema>;
export type Image = z.infer<typeof ImageSchema>;
export type ContentValidationRule = z.infer<typeof ContentValidationRuleSchema>;
