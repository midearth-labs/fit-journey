import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import { globalTracking, articleTracking, type ArticleTracking, type GlobalTracking } from '$lib/server/db/schema';




export interface IStatisticsRepository {
  getGlobalStatistics(): Promise<Omit<GlobalTracking, 'partitionKey'>>;
  
  getArticleStatistics(articleId: string): Promise<Omit<ArticleTracking, 'partitionKey'>>;
}

export class StatisticsRepository implements IStatisticsRepository {
  constructor(private db: NodePgDatabase<any>) {}

  /**
   * Get global statistics by summing across all partitions
   * Uses SUM() to aggregate partitioned data for concurrency
   */
  async getGlobalStatistics(): Promise<Omit<GlobalTracking, 'partitionKey'>> {
    const result = await this.db
      .select({
        userCount: sql`COALESCE(SUM(${globalTracking.userCount}), 0)`.mapWith(Number),
        invitationJoinCount: sql`COALESCE(SUM(${globalTracking.invitationJoinCount}), 0)`.mapWith(Number),
        articleReadCount: sql`COALESCE(SUM(${globalTracking.articleReadCount}), 0)`.mapWith(Number),
        articleCompletedCount: sql`COALESCE(SUM(${globalTracking.articleCompletedCount}), 0)`.mapWith(Number),
        articleCompletedWithPerfectScore: sql`COALESCE(SUM(${globalTracking.articleCompletedWithPerfectScore}), 0)`.mapWith(Number),
        challengesStarted: sql`COALESCE(SUM(${globalTracking.challengesStarted}), 0)`.mapWith(Number),
        challengesJoined: sql`COALESCE(SUM(${globalTracking.challengesJoined}), 0)`.mapWith(Number),
        daysLogged: sql`COALESCE(SUM(${globalTracking.daysLogged}), 0)`.mapWith(Number),
        questionsAsked: sql`COALESCE(SUM(${globalTracking.questionsAsked}), 0)`.mapWith(Number),
        questionsAnswered: sql`COALESCE(SUM(${globalTracking.questionsAnswered}), 0)`.mapWith(Number),
        progressShares: sql`COALESCE(SUM(${globalTracking.progressShares}), 0)`.mapWith(Number),
      })
      .from(globalTracking);

    return result[0];
  }

  /**
   * Get article statistics by summing across all partitions for a specific article
   * Uses SUM() to aggregate partitioned data for concurrency
   */
  async getArticleStatistics(articleId: string): Promise<Omit<ArticleTracking, 'partitionKey'>> {
    const [result] = await this.db
      .select({
        id: articleTracking.id,
        readCount: sql`COALESCE(SUM(${articleTracking.readCount}), 0)`.mapWith(Number),
        completedCount: sql`COALESCE(SUM(${articleTracking.completedCount}), 0)`.mapWith(Number),
        completedWithPerfectScore: sql`COALESCE(SUM(${articleTracking.completedWithPerfectScore}), 0)`.mapWith(Number),
      })
      .from(articleTracking)
      .where(sql`${articleTracking.id} = ${articleId}`)
      .groupBy(articleTracking.id);

    return result;
  }
}
