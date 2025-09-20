import { eq, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { answerReactions, questionAnswers, type AnswerReaction, type NewAnswerReaction } from '$lib/server/db/schema';

export interface IAnswerReactionsRepository {
  upsertAnswerReaction(reaction: NewAnswerReaction): Promise<boolean>;
}

export class AnswerReactionsRepository implements IAnswerReactionsRepository {
  constructor(private db: NodePgDatabase<any>) {}

  async upsertAnswerReaction(reaction: NewAnswerReaction): Promise<boolean> {
    const result = await this.db.transaction(async (tx) => {
      // Attempt upsert with conflict management
      const upsertResult = await tx.insert(answerReactions)
        .values(reaction)
        .onConflictDoUpdate({
          target: [answerReactions.answerId, answerReactions.userId],
          set: {
            reactionType: sql`EXCLUDED.reaction_type`,
            createdAt: sql`EXCLUDED.created_at`
          },
          setWhere: sql`${answerReactions.reactionType} != ${reaction.reactionType} AND ${answerReactions.createdAt} <= ${reaction.createdAt}`
        })
        .returning({
          wasInserted: sql<boolean>`(xmax = 0)`,
        });
      
      if (upsertResult.length === 0) {
        // No rows were affected - data was identical, no count update needed
        return false;
      }
      
      const returnedReaction = upsertResult[0];
      
      if (returnedReaction.wasInserted) {
        // New reaction - increment count
        const countField = reaction.reactionType === 'helpful' ? 'helpfulCount' : 'notHelpfulCount';
        await tx.update(questionAnswers)
          .set({ 
            [countField]: sql`${questionAnswers[countField]} + 1`
          })
          .where(eq(questionAnswers.id, reaction.answerId));
      } else {
        // Updated reaction - since setWhere ensures updates only happen when reaction type changes,
        // we can safely decrement old count and increment new count
        const [newCountField, oldCountField] = reaction.reactionType === 'helpful' ? ['helpfulCount', 'notHelpfulCount'] as const : ['notHelpfulCount', 'helpfulCount'] as const;
        
        await tx.update(questionAnswers)
          .set({ 
            [oldCountField]: sql`${questionAnswers[oldCountField]} - 1`,
            [newCountField]: sql`${questionAnswers[newCountField]} + 1`
          })
          .where(eq(questionAnswers.id, reaction.answerId));
      }
      
      return true;
    });
    
    return result;
  }
}
