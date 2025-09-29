import type { RequestHandler } from './$types';
import { GetArticleStatisticsOperationSchema } from '$lib/server/shared/schemas';
import { parseParams, handleServiceError, validateAndReturn } from '$lib/server/shared/http';

export const GET: RequestHandler = async (event) => {
  try {
    const { articleId } = parseParams(event, GetArticleStatisticsOperationSchema.request.params);
    const { statisticsService } = event.locals.unAuthServices!;
    const statistics = await statisticsService().getArticle(articleId);
    return validateAndReturn(statistics, GetArticleStatisticsOperationSchema.response.body);
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};
