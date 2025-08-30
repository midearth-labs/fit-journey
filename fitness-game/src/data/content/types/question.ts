// Question type definition
// Based on entities.md Question entity

import z from 'zod';
import { BaseContentSchema, ImageSchema } from './common';

export const QuestionSchema = BaseContentSchema.extend({
  knowledge_base_id: z.string(),
  question_text: z.string(),
  question_type: z.enum(['standalone', 'passage_based']),
  options: z.array(z.string()),
  correct_answer_index: z.number(),
  explanation: z.string(),
  hints: z.array(z.string()),
  image_urls: z.array(ImageSchema),
  passage_set_id: z.string().optional(), // FK to PassageSet (null for standalone questions)
});

export type Question = z.infer<typeof QuestionSchema>;
