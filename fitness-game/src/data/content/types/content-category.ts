// ContentCategory type definition
// Based on entities.md ContentCategory entity

import { z } from 'zod';
import { BaseContentSchema, IDSchema } from './common';

// Zod schema for ContentCategory
export const ContentCategorySchema = IDSchema.extend(BaseContentSchema.shape).extend({
  name: z.string(),
  description: z.string(),
  icon_name: z.string(),
  learning_objectives: z.array(z.string()),
  related_categories: z.array(z.string()), // IDs of related categories
});

// Type inferred from Zod schema
export type ContentCategory = z.infer<typeof ContentCategorySchema>;

