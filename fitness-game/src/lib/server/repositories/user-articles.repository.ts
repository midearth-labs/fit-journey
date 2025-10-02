import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, sql } from 'drizzle-orm';
import { userArticles, type UserArticle, type NewUserArticle, userMetadata, articleTracking } from '$lib/server/db/schema';
import { type IPartitionGenerator } from '$lib/server/helpers';
import { type IUserArticlesStateTxRepository, type OverrideArticleFields, type PartialUpdateArticle, type UpdateArticle } from '$lib/server/helpers/article-state-machine-helper-v2';
import type { ArticleLogStatus } from '$lib/server/helpers/article-state-machine-helper-v2';

type UpdateArticleResponse = {id: UserArticle['id']};
export interface IUserArticlesRepository {
  findByUserAndArticle(userId: string, articleId: string): Promise<UserArticle | null>;
  listByUser(userId: string, page?: number, limit?: number): Promise<UserArticle[]>;
  transactionUpdateArticle(userId: string, articleId: string, requestDate: Date, callback: (existingArticle: UserArticle | null) => Promise<UpdateArticle | NewUserArticle>): Promise<UpdateArticleResponse>;
}

export class UserArticlesRepository implements IUserArticlesRepository, IUserArticlesStateTxRepository {
  constructor(private db: NodePgDatabase<any>, private partitionGenerator: IPartitionGenerator) {}

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
      const oldStatus = existing?.status || undefined;
      const oldQuizAllCorrect = existing?.quizAllCorrectAnswers === true;
      let newStatus: ArticleLogStatus | undefined = undefined;
      let newQuizAllCorrect: boolean = oldQuizAllCorrect;
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
          .returning({ id: userArticles.id, status: userArticles.status, quizAllCorrectAnswers: userArticles.quizAllCorrectAnswers });

        if (!updated) {
          throw new Error(`Failed to update user article: ${userId}, ${articleId}`);
        }
        // Use actual persisted values
        newStatus = updated.status as ArticleLogStatus;
        newQuizAllCorrect = updated.quizAllCorrectAnswers === true;
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
            .returning({ id: userArticles.id, status: userArticles.status, quizAllCorrectAnswers: userArticles.quizAllCorrectAnswers });

        if (!inserted) {
            throw new Error(`Failed to insert user article: ${userId}, ${articleId}`);
        }
        newStatus = inserted.status as ArticleLogStatus;
        newQuizAllCorrect = inserted.quizAllCorrectAnswers === true;
        result = { id: inserted.id };
    }

    // Compute deltas and update user metadata atomically only when needed
    const isInsert = !existing;
    const deltaRead = isInsert ? 1 : 0;
    const wasCompleted = oldStatus === 'completed';
    const nowCompleted = newStatus === 'completed';
    const deltaCompleted = (nowCompleted ? 1 : 0) - (wasCompleted ? 1 : 0);
    const oldPerfect = wasCompleted && (oldQuizAllCorrect === true);
    const newPerfect = nowCompleted && (newQuizAllCorrect === true);
    const deltaPerfect = (newPerfect ? 1 : 0) - (oldPerfect ? 1 : 0);

    if (deltaRead !== 0 || deltaCompleted !== 0 || deltaPerfect !== 0) {
      await tx
        .update(userMetadata)
        .set({
          articlesRead: sql`${userMetadata.articlesRead} + ${deltaRead}`,
          articlesCompleted: sql`${userMetadata.articlesCompleted} + ${deltaCompleted}`,
          articlesCompletedWithPerfectScore: sql`${userMetadata.articlesCompletedWithPerfectScore} + ${deltaPerfect}`,
          updatedAt: sql`GREATEST(${userMetadata.updatedAt}, ${requestDate.toISOString()})`,
        })
        .where(eq(userMetadata.id, userId));

      // Update article_tracking by articleId with atomic increments
      const articlePartitionKey = this.partitionGenerator.generateRandomForArticle();
      const updatedArticleTrackingResult = await tx
        .update(articleTracking)
        .set({
          readCount: sql`${articleTracking.readCount} + ${deltaRead}`,
          completedCount: sql`${articleTracking.completedCount} + ${deltaCompleted}`,
          completedWithPerfectScore: sql`${articleTracking.completedWithPerfectScore} + ${deltaPerfect}`,
        })
        .where(and(
          eq(articleTracking.id, articleId),
          eq(articleTracking.partitionKey, articlePartitionKey)
        ));

      if (updatedArticleTrackingResult.rowCount === 0) {
        // @TODO: Add a metric here with an alarm on one single data-point
        console.error(`Failed to update article tracking: ${articleId}, ${articlePartitionKey}`);
      }
    }

    return result;
    });
  }
}
