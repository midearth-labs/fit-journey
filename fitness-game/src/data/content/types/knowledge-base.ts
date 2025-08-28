// KnowledgeBase type definition
// Based on entities.md KnowledgeBase entity

import z from 'zod';
import { BaseContentSchema, LearnMoreLinkSchema, AffiliateLinkSchema, ImageSchema } from './common';

export const KnowledgeBaseSchema = BaseContentSchema.extend({
  content_category_id: z.string(),
  landing_image: ImageSchema,
  title: z.string(),
  description: z.string(), // markdown content containing image urls etc.
  tags: z.array(z.string()),
  related_knowledge_base_ids: z.array(z.string()),
  learn_more_links: z.array(LearnMoreLinkSchema),
  affiliate_links: z.array(AffiliateLinkSchema),
  image_urls: z.array(ImageSchema),
  
  // Extended fields for content management
  estimated_read_time_minutes: z.number(),
  word_count: z.number(),
  key_takeaways: z.array(z.string()),
});

export type KnowledgeBase = z.infer<typeof KnowledgeBaseSchema>;
