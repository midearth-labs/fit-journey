import type { RequestHandler } from './$types';
import { GetPublicSharesOperationSchema } from '$lib/server/shared/schemas';
import { parseQuery, handleServiceError, validateAndReturn } from '$lib/server/shared/http';

export const GET: RequestHandler = async (event) => {
  try {
    const dto = parseQuery(event, GetPublicSharesOperationSchema.request.query);
    const { progressSharesService } = event.locals.authServices!;
    const shares = await progressSharesService().getPublicShares({...dto, page: dto.page!, limit: dto.limit!});
    return validateAndReturn(shares, GetPublicSharesOperationSchema.response.body);
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};
