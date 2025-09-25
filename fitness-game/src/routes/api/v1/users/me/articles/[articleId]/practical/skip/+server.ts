import type { RequestHandler } from './$types';
import { SkipPracticalOperationSchema } from '$lib/server/shared/schemas';
import { parseParams, handleServiceError, noContent } from '$lib/server/shared/http';

export const POST: RequestHandler = async (event) => {
  try {
    const { articleId } = parseParams(event, SkipPracticalOperationSchema.request.params);
    const { articleService } = event.locals.authServices!;
    await articleService().skipPractical({ articleId });
    return noContent();
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};
