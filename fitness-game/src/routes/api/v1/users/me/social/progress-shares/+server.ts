import type { RequestHandler } from './$types';
import { GetUserSharesOperationSchema, ShareProgressOperationSchema } from '$lib/server/shared/schemas';
import { parseQuery, handleServiceError, validateAndReturn, parseBody } from '$lib/server/shared/http';

export const GET: RequestHandler = async (event) => {
  try {
    const dto = parseQuery(event, GetUserSharesOperationSchema.request.query);
    const { progressSharesService } = event.locals.authServices!;
    const shares = await progressSharesService().getUserShares({...dto, page: dto.page!, limit: dto.limit!});
    return validateAndReturn(shares, GetUserSharesOperationSchema.response.body);
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};

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
