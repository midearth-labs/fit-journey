import type { RequestHandler } from './$types';
import { PutUserLogOperationSchema, DeleteUserLogOperationSchema, FindUserLogOperationSchema } from '$lib/server/shared/schemas';
import { parseBody, parseParams, handleServiceError, noContent, validateAndReturn } from '$lib/server/shared/http';

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
      values: {
        fiveStar: values.fiveStar!,
        measurement: values.measurement!,
      }
    });
    
    // Return 204 No Content for successful update
    return noContent();
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};

export const DELETE: RequestHandler = async (event) => {
  try {
    // Parse route parameters
    const { logDate } = parseParams(event, DeleteUserLogOperationSchema.request.params);
    
    // Get authenticated services (guaranteed to exist in protected /api/v1 routes)
    const { logService } = event.locals.authServices!;
    
    // Call service to delete log
    await logService().deleteUserLog({ logDate });
    
    // Return 204 No Content for successful deletion
    return noContent();
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};

export const GET: RequestHandler = async (event) => {
  try {
    // Parse route parameters
    const { logDate } = parseParams(event, FindUserLogOperationSchema.request.params);
    
    // Get authenticated services (guaranteed to exist in protected /api/v1 routes)
    const { logService } = event.locals.authServices!;
    
    // Call service to find log
    const log = await logService().findUserLog({ logDate });
    
    // Return the log or null
    return validateAndReturn(log, FindUserLogOperationSchema.response.body);
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};
