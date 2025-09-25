import { z } from 'zod';
import { BaseContentSchema, IDSchema } from './common';

// Zod schemas
export const PersonaTagsSchema = z.enum([
  // Knowledge Level
  'complete_beginner',
  'some_knowledge',
  'intermediate',
  
  // Time Availability
  'time_poor',
  'time_flexible',
  'weekend_only',
  
  // Motivation Type
  'needs_motivation',
  'self_motivated',
  'socially_motivated',
  'data_driven',
  
  // Goals
  'weight_loss',
  'muscle_gain',
  'health_focus',
  'general_fitness',
  
  // Barriers
  'gym_anxiety',
  'restart_anxiety',
  'injury_concern',
  'no_gym_access',
  
  // Life Situation
  'busy_parent',
  'busy_professional',
  'student',
  
  // Personality
  'analytical',
  'action_oriented',
  'cautious',
  'social'
]).describe('Persona tags that categorize user characteristics and preferences');

export const LearningPathSchema = IDSchema
.extend(BaseContentSchema.pick({is_active: true}).shape)
.extend({
  name: z.string().describe('The name of the learning path'),
  description: z.string().describe('A description of what this learning path covers'),
  articles: z.array(z.object({
    id: z.string().describe('The ID of the article'),
    title: z.string().describe('The title of the article')
  })).describe('Array of articles in order for this learning path'),
  personaWeights: z.partialRecord(PersonaTagsSchema, z.number()).describe('How much each persona tag contributes to this path')
});

// Inferred types from Zod schemas
export type PersonaTags = z.infer<typeof PersonaTagsSchema>;
export type LearningPath = z.infer<typeof LearningPathSchema>;
  