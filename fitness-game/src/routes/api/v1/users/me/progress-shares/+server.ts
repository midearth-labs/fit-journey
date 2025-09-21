import type { RequestHandler } from './$types';
import { GetUserSharesOperationSchema } from '$lib/server/shared/schemas';
import { parseQuery, handleServiceError, validateAndReturn } from '$lib/server/shared/http';

export const GET: RequestHandler = async (event) => {
  try {
    const dto = parseQuery(event, GetUserSharesOperationSchema.request.query);
    const { progressSharesService } = event.locals.authServices!;
    const shares = await progressSharesService().getUserShares(dto);
    return validateAndReturn(shares, GetUserSharesOperationSchema.response.body);
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};
