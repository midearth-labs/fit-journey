import { type MaybeAuthRequestContext, type GlobalStatisticsResponse, type ArticleStatisticsResponse } from '$lib/server/shared/interfaces';
import { type IStatisticsRepository } from '$lib/server/repositories';
import { type IDateTimeHelper } from '$lib/server/helpers';

export type IStatisticsService = {
  /**
   * Get global statistics across all users and activities
   * GET /api/v1/statistics/global
   */
  getGlobal(): Promise<GlobalStatisticsResponse>;

  /**
   * Get statistics for a specific article
   * GET /api/v1/statistics/articles/:articleId
   */
  getArticle(articleId: string): Promise<ArticleStatisticsResponse>;
};

export class StatisticsService implements IStatisticsService {
  constructor(
    private readonly dependencies: {
      readonly statisticsRepository: IStatisticsRepository;
      readonly dateTimeHelper: IDateTimeHelper;
    },
    private readonly requestContext: MaybeAuthRequestContext
  ) {}

  async getGlobal(): Promise<GlobalStatisticsResponse> {
    const { statisticsRepository, dateTimeHelper } = this.dependencies;
    const { requestDate } = this.requestContext;
    
    return {
      ...(await statisticsRepository.getGlobalStatistics()),
      serverDate: requestDate.toISOString(),
      serverDateRanges: dateTimeHelper.getPossibleDatesOnEarthAtInstant(requestDate)
    };
  }

  async getArticle(articleId: string): Promise<ArticleStatisticsResponse> {
    const { statisticsRepository } = this.dependencies;
    
    return await statisticsRepository.getArticleStatistics(articleId);
  }
}
