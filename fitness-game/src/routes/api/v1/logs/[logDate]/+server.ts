import type { RequestHandler } from './$types';
import { z } from 'zod';
import { IsoDateSchema } from '$lib/server/shared/z.primitives';
import { DailyLogPayloadSchema } from '$lib/server/shared/schemas';
import { parseBody, parseParams, handleServiceError, noContent } from '$lib/server/shared/http';

// Schema for route parameters
const LogDateParamsSchema = z.object({
  logDate: IsoDateSchema
});

// Schema for request body (values only, logDate comes from URL)
const PutUserLogBodySchema = z.object({
  values: DailyLogPayloadSchema
});

export const PUT: RequestHandler = async (event) => {
  try {
    // Parse route parameters
    const { logDate } = parseParams(event, LogDateParamsSchema);
    
    // Parse request body
    const { values } = await parseBody(event, PutUserLogBodySchema);
    
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
