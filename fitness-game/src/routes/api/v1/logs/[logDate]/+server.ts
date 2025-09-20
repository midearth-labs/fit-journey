import type { RequestHandler } from './$types';
import { PutUserLogOperationSchema } from '$lib/server/shared/schemas';
import { parseBody, parseParams, handleServiceError, noContent } from '$lib/server/shared/http';

export const PUT: RequestHandler = async (event) => {
  try {
    // Parse route parameters
    const { logDate } = parseParams(event, PutUserLogOperationSchema.request.params);
    
    // Parse request body
    const { values } = await parseBody(event, PutUserLogOperationSchema.request.body);
    
    // Get authenticated services (guaranteed to exist in protected /api/v1 routes)
    const { logService } = event.locals.authServices!;
    
    // Call service with combined DTO
    await logService().putUserLog({
      logDate,
      values
    });
    
    // Return 204 No Content for successful update
    return noContent();
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};
