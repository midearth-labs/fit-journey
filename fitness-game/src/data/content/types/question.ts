// Question type definition
// Based on entities.md Question entity

import z from 'zod';
import { BaseContentSchema, ImageSchema } from './common';

export const QuestionSchema = BaseContentSchema.extend({
  knowledge_base_id: z.string().describe('The knowledge base ID of the article.'),
  question_text: z.string().describe('The text of the question. Must be a quick read'),
  question_type: z.enum(['standalone', 'passage_based']),
  options: z.array(z.string()).min(2).max(4).describe('The options of the question. 2 options for true/false questions. 4 options for others'),
  correct_answer_index: z.number().describe('The index of the correct answer out of the options.'),
  explanation: z.string().describe('A concise explanation of the question.'),
  hints: z.array(z.string()).min(1).max(2).describe('A list of 1 - 2 hints that could be used to help the user answer the question.'),
  image_urls: z.array(ImageSchema).min(0).max(2).describe('The images to be referenced in the question or options markdown, reserve this only for rare graphical cases, maybe exercise or equipment identification or nutrition related questions. Between 0 to 10 images.'),
  passage_set_id: z.string().optional().describe('The passage set ID of the question. null for standalone questions'), // FK to PassageSet (null for standalone questions)
});

export type Question = z.infer<typeof QuestionSchema>;


