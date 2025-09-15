import { z } from 'zod';

// Common type definitions for content management

// Zod schemas
export const BaseContentSchema = z.object({
  created_at: z.string().describe('The date and time the content was created.'),
  updated_at: z.string().describe('The date and time the content was last updated.'),
  is_active: z.boolean().describe('Whether the content is active and should be displayed.'),
  sort_order: z.number().describe('The order of the content in the list. Used for display ordering.'),
});

export const IDSchema = z.object({
  id: z.string().describe('The ID of the content entity. Must be unique and immutable.'),
});

export const UUIDSchema = z.object({
  // @TODO: Use uuid v4 instead of guid
  id: z.guid().describe('The ID of the content entity. Must be a UUID, unique and immutable.'),
});

export const UnlockConditionSchema = z.object({
  type: z.enum(['streak', 'questions', 'score', 'habits', 'perfect_days']),
  value: z.number(),
  streak_type: z.string().optional(),
  content_category_id: z.string().optional(),
  additional_conditions: z.record(z.string(), z.any()).optional(),
});

export const LearnMoreLinkSchema = z.object({
  type: z.enum(['youtube_short', 'blog', 'article', 'other_video', 'tiktok_short', 'ig_reel', 'app_store', 'google_play']),
  url: z.string(),
  title: z.string(),
  description: z.string().optional(),
  duration_seconds: z.number().optional().describe('The duration of the link in seconds. Only applicable for video content type of links.'),
}).describe('External link to learn more about the related content.');

export const AffiliateLinkSchema = z.object({
  type: z.enum(['amazon', 'gymshark', 'temu', 'shein', 'other']),
  url: z.string(),
  title: z.string(),
  description: z.string(),
}).describe('Affiliate link to purchase products or services related to the content.');

export const ImageSchema = z.object({
  path: z.string().describe('Relative path of the image. Should be relative to the content specific directory under the images directory. i.e. "/images/knowledge-base/{article-id}/{image-id}.png", this relative Image URL will be used in the associated content markdown'),
  description: z.string().describe('The description of the image. Used for alt text and other purposes.'),
  width: z.number(),
  height: z.number(),
  prompt_generation_string: z.string().describe('The prompt that will be used to generate the image.'),
});

// Inferred types from Zod schemas
export type BaseContent = z.infer<typeof BaseContentSchema>;
export type UnlockCondition = z.infer<typeof UnlockConditionSchema>;
export type LearnMoreLink = z.infer<typeof LearnMoreLinkSchema>;
export type AffiliateLink = z.infer<typeof AffiliateLinkSchema>;
export type Image = z.infer<typeof ImageSchema>;
