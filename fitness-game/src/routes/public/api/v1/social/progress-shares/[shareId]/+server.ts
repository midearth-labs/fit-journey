import type { RequestHandler } from './$types';
import { GetShareOperationSchema } from '$lib/server/shared/schemas';
import { parseParams, handleServiceError, validateAndReturn } from '$lib/server/shared/http';

export const GET: RequestHandler = async (event) => {
  try {
    const dto = parseParams(event, GetShareOperationSchema.request.params);
    const { progressSharesUnAuthenticatedService } = event.locals.unAuthServices!;
    const share = await progressSharesUnAuthenticatedService().getShare(dto);
    return validateAndReturn(share, GetShareOperationSchema.response.body);
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};
