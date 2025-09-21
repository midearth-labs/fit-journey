import type { RequestHandler } from './$types';
import { ShareProgressOperationSchema, GetPublicSharesOperationSchema } from '$lib/server/shared/schemas';
import { parseBody, parseQuery, handleServiceError, validateAndReturn, noContent } from '$lib/server/shared/http';

export const POST: RequestHandler = async (event) => {
  try {
    const dto = await parseBody(event, ShareProgressOperationSchema.request.body);
    const { progressSharesService } = event.locals.authServices!;
    const share = await progressSharesService().shareProgress(dto);
    return validateAndReturn(share, ShareProgressOperationSchema.response.body);
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};

export const GET: RequestHandler = async (event) => {
  try {
    const dto = parseQuery(event, GetPublicSharesOperationSchema.request.query);
    const { progressSharesService } = event.locals.authServices!;
    const shares = await progressSharesService().getPublicShares(dto);
    return validateAndReturn(shares, GetPublicSharesOperationSchema.response.body);
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};
