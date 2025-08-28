// DailyChallenge type definition
// Based on entities.md DailyChallenge entity

import { z } from 'zod';
import { BaseContentSchema } from './common';

export const ChallengeStructureSchema = z.object({
  challenge: z.discriminatedUnion('type', [
    z.object({
      type: z.literal('standalone'),
      question_id: z.string()
    }),
    z.object({
      type: z.literal('passage'), 
      passage_set_id: z.string(),
      question_ids: z.array(z.string())
    })
  ]),
  sort_order: z.number()
});

export const DailyChallengeSchema = BaseContentSchema.extend({
  content_category_id: z.string(),
  day: z.number(),
  challenge_structure: z.array(ChallengeStructureSchema),
});

// Original interface for reference
// export interface ChallengeStructure {
//   challenge: { type: 'standalone', question_id: string } | { type: 'passage', passage_set_id: string, question_ids: string[] };
//   sort_order: number;
// }

export type ChallengeStructure = z.infer<typeof ChallengeStructureSchema>;
export type DailyChallenge = z.infer<typeof DailyChallengeSchema>;