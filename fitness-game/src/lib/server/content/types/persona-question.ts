import { z } from 'zod';
import { BaseContentSchema, IDSchema } from './common';
import { PersonaTagsSchema } from './learning-paths';

// Zod schemas
export const PersonaAnswerOptionSchema = z.object({
  text: z.string().describe('The text of the answer option'),
  tags: z.array(PersonaTagsSchema).describe('The persona tags associated with this answer'),
  weight: z.number().optional().describe('Optional weight multiplier for certain tags (default 1)')
});

export const PersonaQuestionSchema = IDSchema
.extend(BaseContentSchema.pick({is_active: true}).shape)
.extend({
  text: z.string().describe('The question text'),
  category: z.enum(['knowledge', 'preference', 'situation', 'goals', 'barriers']).describe('The category of the question'),
  answers: z.array(PersonaAnswerOptionSchema).describe('The available answer options for this question')
});

// Inferred types from Zod schemas
export type PersonaAnswerOption = z.infer<typeof PersonaAnswerOptionSchema>;
export type PersonaQuestion = z.infer<typeof PersonaQuestionSchema>;