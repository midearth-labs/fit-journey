import { z } from 'zod';
import { BaseContentSchema, UUIDSchema } from './common';
import { KnowledgeBaseSchema } from './knowledge-base';
import { HabitIdsSchema } from './streak-type';

/**
 * Defines the link between a Challenge and a Knowledge Base article.
 */
export const ChallengeArticleSchema = z.object({
  knowledgeBaseId: KnowledgeBaseSchema.shape.id.describe("The unique ID of the knowledge_base (article) this entry refers to."),

  /**
   * The suggested day in the challenge to read this article.
   * This provides a guided path, though users have random access.
   */
  suggestedDay: z.number().int().positive(),
});

/**
 * The primary schema for a Challenge Template.
 * This defines the entire blueprint for a challenge like "30-day FitJourney".
 * This schema is used to validate the static JSON files loaded by the application.
 */
export const ChallengeSchema = UUIDSchema.extend(BaseContentSchema.shape).extend({
    name: z.string().describe("The name of the challenge"),
    description: z.string().describe("A marketing or explanatory description of the challenge."),
    durationDays: z.number().int().positive({ message: "Duration must be at least 1 day." }).describe("The total duration of the challenge in days."),
    articles: z.array(ChallengeArticleSchema).describe("An array of articles that are part of this challenge's curriculum."),
    habits: z.array(HabitIdsSchema).describe("An array of habits that users are expected to track during this challenge."),
});

// To infer the TypeScript type directly from the schema:
export type Challenge = z.infer<typeof ChallengeSchema>;