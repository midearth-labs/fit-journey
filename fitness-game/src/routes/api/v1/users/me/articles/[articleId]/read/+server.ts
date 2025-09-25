import type { RequestHandler } from './$types';
import { LogReadOperationSchema } from '$lib/server/shared/schemas';
import { parseParams, handleServiceError, noContent } from '$lib/server/shared/http';

export const POST: RequestHandler = async (event) => {
  try {
    const { articleId } = parseParams(event, LogReadOperationSchema.request.params);
    const { articleService } = event.locals.authServices!;
    await articleService().logRead({ articleId });
    return noContent();
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};
