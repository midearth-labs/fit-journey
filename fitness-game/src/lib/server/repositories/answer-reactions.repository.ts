import { eq, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { answerReactions, questionAnswers } from '$lib/server/db/schema';

export interface IAnswerReactionsRepository {
  upsertAnswerReaction(reaction: {
    answerId: string;
    userId: string;
    reactionType: 'helpful' | 'not_helpful';
    createdAt: Date;
  }): Promise<boolean>;
}

export class AnswerReactionsRepository implements IAnswerReactionsRepository {
  constructor(private db: NodePgDatabase<any>) {}

  async upsertAnswerReaction(reaction: {
    answerId: string;
    userId: string;
    reactionType: 'helpful' | 'not_helpful';
    createdAt: Date;
  }): Promise<boolean> {
    const result = await this.db.transaction(async (tx) => {
      const upsertResult = await tx.insert(answerReactions)
        .values(reaction)
        .onConflictDoUpdate({
          target: [answerReactions.answerId, answerReactions.userId],
          set: {
            reactionType: sql`EXCLUDED.${sql.raw(answerReactions.reactionType.name)}`,
            createdAt: sql`EXCLUDED.${sql.raw(answerReactions.createdAt.name)}`
          },
          setWhere: sql`${answerReactions.reactionType} != ${reaction.reactionType} AND ${answerReactions.createdAt} <= ${reaction.createdAt}`
        })
        .returning({
          wasInserted: sql`(xmax = 0)`.mapWith(Boolean),
        });

      if (upsertResult.length === 0) {
        return false;
      }

      const wasInserted = upsertResult[0].wasInserted;

      if (wasInserted) {
        const countField = reaction.reactionType === 'helpful' ? 'helpfulCount' : 'notHelpfulCount';
        await tx.update(questionAnswers)
          .set({ 
            [countField]: sql`${questionAnswers[countField]} + 1`,
          })
          .where(eq(questionAnswers.id, reaction.answerId));
      } else {
        const [newCountField, oldCountField] = reaction.reactionType === 'helpful'
          ? ['helpfulCount', 'notHelpfulCount'] as const
          : ['notHelpfulCount', 'helpfulCount'] as const;

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


