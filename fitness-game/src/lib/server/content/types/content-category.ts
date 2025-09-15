// ContentCategory type definition
// Based on entities.md ContentCategory entity

import { z } from 'zod';
import { BaseContentSchema, IDSchema } from './common';

// Zod schema for ContentCategory
export const ContentCategorySchema = IDSchema.extend(BaseContentSchema.shape).extend({
  name: z.string().describe("The name of the category"),
  description: z.string().describe("The description of the category"),
  icon_name: z.string().describe("The icon name of the category"),
  learning_objectives: z.array(z.string()).describe("The learning objectives of the category"),
  related_categories: z.array(z.string()).describe("The IDs of related categories"),
});

// Type inferred from Zod schema
export type ContentCategory = z.infer<typeof ContentCategorySchema>;
