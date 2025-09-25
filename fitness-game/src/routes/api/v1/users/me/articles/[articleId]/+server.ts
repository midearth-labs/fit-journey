import type { RequestHandler } from './$types';
import { GetUserArticleOperationSchema } from '$lib/server/shared/schemas';
import { parseParams, handleServiceError, validateAndReturn } from '$lib/server/shared/http';

export const GET: RequestHandler = async (event) => {
  try {
    const { articleId } = parseParams(event, GetUserArticleOperationSchema.request.params);
    const { articleService } = event.locals.authServices!;
    const article = await articleService().getUserArticle({ articleId });
    return validateAndReturn(article, GetUserArticleOperationSchema.response.body);
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};
