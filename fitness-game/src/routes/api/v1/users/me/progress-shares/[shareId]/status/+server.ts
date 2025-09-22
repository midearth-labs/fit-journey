import type { RequestHandler } from './$types';
import { UpdateShareStatusOperationSchema } from '$lib/server/shared/schemas';
import { parseParams, parseBody, handleServiceError, noContent } from '$lib/server/shared/http';

export const PUT: RequestHandler = async (event) => {
  try {
    const params = parseParams(event, UpdateShareStatusOperationSchema.request.params);
    const body = await parseBody(event, UpdateShareStatusOperationSchema.request.body);
    const dto = { ...params, ...body };
    
    const { progressSharesService } = event.locals.authServices!;
    await progressSharesService().updateStatus(dto);
    
    return noContent();
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};
