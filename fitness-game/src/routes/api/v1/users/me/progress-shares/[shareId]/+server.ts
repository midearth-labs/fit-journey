import type { RequestHandler } from './$types';
import { GetUserShareOperationSchema } from '$lib/server/shared/schemas';
import { parseParams, handleServiceError, validateAndReturn } from '$lib/server/shared/http';

export const GET: RequestHandler = async (event) => {
  try {
    const dto = parseParams(event, GetUserShareOperationSchema.request.params);
    const { progressSharesService } = event.locals.authServices!;
    const share = await progressSharesService().getUserShare(dto);
    return validateAndReturn(share, GetUserShareOperationSchema.response.body);
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};
