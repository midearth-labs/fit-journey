import type { RequestHandler } from './$types';
import { ListUserLogsOperationSchema } from '$lib/server/shared/schemas';
import { parseQuery, handleServiceError, validateAndReturn } from '$lib/server/shared/http';

export const GET: RequestHandler = async (event) => {
  try {
    // Parse and validate query parameters
    const dto = parseQuery(event, ListUserLogsOperationSchema.request.query);
    
    // Get authenticated services (guaranteed to exist in protected /api/v1 routes)
    const { logService } = event.locals.authServices!;
    
    // Call service
    const logs = await logService().listUserLogs({...dto, page: dto.page!, limit: dto.limit!});
    
    // Validate response and return
    return validateAndReturn(logs, ListUserLogsOperationSchema.response.body);
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};
