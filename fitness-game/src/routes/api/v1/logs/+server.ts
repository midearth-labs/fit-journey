import type { RequestHandler } from './$types';
import { ListUserLogsQuerySchema, UserLogResponseSchema } from '$lib/server/shared/schemas';
import { parseQuery, handleServiceError, validateAndReturn } from '$lib/server/shared/http';

export const GET: RequestHandler = async (event) => {
  try {
    // Parse and validate query parameters
    const dto = parseQuery(event, ListUserLogsQuerySchema);
    
    // Get authenticated services (guaranteed to exist in protected /api/v1 routes)
    const { logService } = event.locals.authServices!;
    
    // Call service
    const logs = await logService().listUserLogs(dto);
    
    // Validate response and return
    return validateAndReturn(logs, UserLogResponseSchema.array());
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};
