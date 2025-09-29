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
        userCount: sql<number>`COALESCE(SUM(${globalTracking.userCount}), 0)`,
        invitationJoinCount: sql<number>`COALESCE(SUM(${globalTracking.invitationJoinCount}), 0)`,
        articleReadCount: sql<number>`COALESCE(SUM(${globalTracking.articleReadCount}), 0)`,
        articleCompletedCount: sql<number>`COALESCE(SUM(${globalTracking.articleCompletedCount}), 0)`,
        articleCompletedWithPerfectScore: sql<number>`COALESCE(SUM(${globalTracking.articleCompletedWithPerfectScore}), 0)`,
        challengesStarted: sql<number>`COALESCE(SUM(${globalTracking.challengesStarted}), 0)`,
        challengesJoined: sql<number>`COALESCE(SUM(${globalTracking.challengesJoined}), 0)`,
        daysLogged: sql<number>`COALESCE(SUM(${globalTracking.daysLogged}), 0)`,
        questionsAsked: sql<number>`COALESCE(SUM(${globalTracking.questionsAsked}), 0)`,
        questionsAnswered: sql<number>`COALESCE(SUM(${globalTracking.questionsAnswered}), 0)`,
        progressShares: sql<number>`COALESCE(SUM(${globalTracking.progressShares}), 0)`,
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
        readCount: sql<number>`COALESCE(SUM(${articleTracking.readCount}), 0)`,
        completedCount: sql<number>`COALESCE(SUM(${articleTracking.completedCount}), 0)`,
        completedWithPerfectScore: sql<number>`COALESCE(SUM(${articleTracking.completedWithPerfectScore}), 0)`,
      })
      .from(articleTracking)
      .where(sql`${articleTracking.id} = ${articleId}`)
      .groupBy(articleTracking.id);

    return result;
  }
}
