import type { RequestHandler } from './$types';
import { GetGlobalStatisticsOperationSchema } from '$lib/server/shared/schemas';
import { handleServiceError, validateAndReturn } from '$lib/server/shared/http';

export const GET: RequestHandler = async (event) => {
  try {
    const { statisticsService } = event.locals.unAuthServices!;
    const statistics = await statisticsService().getGlobal();
    return validateAndReturn(statistics, GetGlobalStatisticsOperationSchema.response.body);
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};
