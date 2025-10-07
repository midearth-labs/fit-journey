import { eq, and, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { questionReactions, questions, type Question, type QuestionReaction, type NewQuestionReaction } from '$lib/server/db/schema';

export interface IQuestionReactionsRepository {
  upsertQuestionReaction(reaction: NewQuestionReaction): Promise<boolean>;
}

export class QuestionReactionsRepository implements IQuestionReactionsRepository {
  constructor(private db: NodePgDatabase<any>) {}

  async upsertQuestionReaction(reaction: NewQuestionReaction): Promise<boolean> {
    const result = await this.db.transaction(async (tx) => {
      // Attempt upsert with conflict management
      const upsertResult = await tx.insert(questionReactions)
        .values(reaction)
        .onConflictDoUpdate({
          target: [questionReactions.questionId, questionReactions.userId],
          set: {
            reactionType: sql`EXCLUDED.${sql.raw(questionReactions.reactionType.name)}`,
            createdAt: sql`EXCLUDED.${sql.raw(questionReactions.createdAt.name)}`
          },
          setWhere: sql`${questionReactions.reactionType} != ${reaction.reactionType} AND ${questionReactions.createdAt} <= ${reaction.createdAt}`
        })
        .returning({
          wasInserted: sql`(xmax = 0)`.mapWith(Boolean),
        });
      
      if (upsertResult.length === 0) {
        // No rows were affected - data was identical, no count update needed
        return false;
      }
      
      const returnedReaction = upsertResult[0];
      
      if (returnedReaction.wasInserted) {
        // New reaction - increment count
        const countField = reaction.reactionType === 'helpful' ? 'helpfulCount' : 'notHelpfulCount';
        await tx.update(questions)
          .set({ 
            [countField]: sql`${questions[countField]} + 1`
          })
          .where(eq(questions.id, reaction.questionId));
      } else {
        // Updated reaction - since setWhere ensures updates only happen when reaction type changes,
        // we can safely decrement old count and increment new count
        const [newCountField, oldCountField] = reaction.reactionType === 'helpful' ? ['helpfulCount', 'notHelpfulCount'] as const : ['notHelpfulCount', 'helpfulCount'] as const;
        
        await tx.update(questions)
          .set({ 
            [oldCountField]: sql`${questions[oldCountField]} - 1`,
            [newCountField]: sql`${questions[newCountField]} + 1`
          })
          .where(eq(questions.id, reaction.questionId));
      }
      
      return true;
    });
    
    return result;
  }
}
