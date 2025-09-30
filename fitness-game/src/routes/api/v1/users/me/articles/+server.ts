import type { RequestHandler } from './$types';
import { ListUserArticlesOperationSchema } from '$lib/server/shared/schemas';
import { parseQuery, handleServiceError, validateAndReturn } from '$lib/server/shared/http';

export const GET: RequestHandler = async (event) => {
  try {
    const dto = parseQuery(event, ListUserArticlesOperationSchema.request.query);
    const { articleService } = event.locals.authServices!;
    const articles = await articleService().listUserArticles({...dto, page: dto.page!, limit: dto.limit!});
    return validateAndReturn(articles, ListUserArticlesOperationSchema.response.body);
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};
