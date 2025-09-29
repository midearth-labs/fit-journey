import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, sql } from 'drizzle-orm';
import { userArticles, type UserArticle, type NewUserArticle, userMetadata } from '$lib/server/db/schema';
import { type IUserArticlesStateTxRepository, type OverrideArticleFields, type PartialUpdateArticle, type UpdateArticle } from '$lib/server/helpers/article-state-machine-helper-v2';
import type { ArticleLogStatus } from '$lib/server/helpers/article-state-machine-helper-v2';

type UpdateArticleResponse = {id: UserArticle['id']};
export interface IUserArticlesRepository {
  findByUserAndArticle(userId: string, articleId: string): Promise<UserArticle | null>;
  listByUser(userId: string, page?: number, limit?: number): Promise<UserArticle[]>;
  transactionUpdateArticle(userId: string, articleId: string, requestDate: Date, callback: (existingArticle: UserArticle | null) => Promise<UpdateArticle | NewUserArticle>): Promise<UpdateArticleResponse>;
}

export class UserArticlesRepository implements IUserArticlesRepository, IUserArticlesStateTxRepository {
  constructor(private db: NodePgDatabase<any>) {}

  /**
   * Find user article
   */
  async findByUserAndArticle(userId: string, articleId: string): Promise<UserArticle | null> {
    const [result] = await this.db
      .select()
      .from(userArticles)
      .where(and(eq(userArticles.userId, userId), eq(userArticles.articleId, articleId)))
      .limit(1);
    
    return result || null;
  }

  /**
   * List user articles with pagination
   */
  async listByUser(userId: string, page: number = 0, limit: number = 50): Promise<UserArticle[]> {
    return await this.db
      .select()
      .from(userArticles)
      .where(eq(userArticles.userId, userId))
      .orderBy(userArticles.lastReadDate)
      .limit(limit)
      .offset(page * limit);
  }

  /**
   * Generic transactional update used by the V2 state machine engine.
   * Locks the row, builds the next snapshot via callback, then upserts.
   */
  async transactionUpdateArticle(
    userId: string,
    articleId: string,
    requestDate: Date,
    callback: (existingArticle: UserArticle | null) => Promise<UpdateArticle | NewUserArticle>
  ): Promise<UpdateArticleResponse> {
    return await this.db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(userArticles)
        .where(and(eq(userArticles.userId, userId), eq(userArticles.articleId, articleId)))
        .for('update')
        .limit(1);
      
      let result: UpdateArticleResponse | null = null;
      const counterTransitionCheckStatuses: ArticleLogStatus[] = ['completed'];
      const oldStatus = existing?.status || undefined;
      let newStatus: ArticleLogStatus | undefined = undefined;
      if (existing) {
        const updateArticle = await callback(existing) as PartialUpdateArticle;
        newStatus = updateArticle.status;
        const [updated] = await tx
          .update(userArticles)
          .set({
            ...updateArticle,
            // Preserve userId/articleId; take other fields from next
            // 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'articleId'
            id: existing.id,
            createdAt: existing.createdAt,
            userId: existing.userId,
            articleId: existing.articleId,
            updatedAt: requestDate,
          } satisfies OverrideArticleFields)
          .where(and(eq(userArticles.userId, existing.userId), eq(userArticles.articleId, existing.articleId)))
          .returning({ id: userArticles.id });

        if (!updated) {
          throw new Error(`Failed to update user article: ${userId}, ${articleId}`);
        }
        result = { id: updated.id };
      } else {
        const newArticle = await callback(null) as NewUserArticle;
        newStatus = newArticle.status;
        const [inserted] = await tx
            .insert(userArticles)
            .values({
            userId,
            articleId,
            firstReadDate: newArticle.firstReadDate,
            lastReadDate: newArticle.lastReadDate,
            status: newStatus,
            quizAttempts: newArticle.quizAttempts,
            createdAt: requestDate,
            updatedAt: requestDate,
            })
            .returning({ id: userArticles.id });

        if (!inserted) {
            throw new Error(`Failed to insert user article: ${userId}, ${articleId}`);
        }
        result = { id: inserted.id };
    }

    // Update user metadata to recompute articlesRead count in a single query
    // if we are moving towards or away from a counter status, we need to update the articlesRead count
    if ((newStatus && counterTransitionCheckStatuses.includes(newStatus)) || 
        (oldStatus && counterTransitionCheckStatuses.includes(oldStatus))) {
        const counterStatus: ArticleLogStatus = 'completed';
        await tx
        .update(userMetadata)
        .set({
            articlesCompleted: sql`(SELECT COUNT(*) FROM ${userArticles} WHERE ${userArticles.userId} = ${userId} AND ${userArticles.status} = ${counterStatus})`,
            articlesCompletedWithPerfectScore: sql`(SELECT COUNT(*) FROM ${userArticles} WHERE ${userArticles.userId} = ${userId} AND ${userArticles.status} = ${counterStatus} AND ${userArticles.quizAllCorrectAnswers} = true)`,
            updatedAt: requestDate,
        })
        .where(eq(userMetadata.id, userId));
        // End of Selection
    }

    return result;
    });
  }
}
