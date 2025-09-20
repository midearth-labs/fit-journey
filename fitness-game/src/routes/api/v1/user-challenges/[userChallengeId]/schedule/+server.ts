import type { RequestHandler } from './$types';
import { UpdateUserChallengeScheduleOperationSchema } from '$lib/server/shared/schemas';
import { parseBody, parseParams, handleServiceError, noContent } from '$lib/server/shared/http';

export const PATCH: RequestHandler = async (event) => {
  try {
    // Parse route parameters
    const { userChallengeId } = parseParams(event, UpdateUserChallengeScheduleOperationSchema.request.params);
    
    // Parse request body
    const { newStartDate } = await parseBody(event, UpdateUserChallengeScheduleOperationSchema.request.body);
    
    // Get authenticated services (guaranteed to exist in protected /api/v1 routes)
    const { challengeService } = event.locals.authServices!;
    
    // Call service
    await challengeService().updateUserChallengeSchedule({
      userChallengeId,
      newStartDate
    });
    
    // Return 204 No Content for successful update
    return noContent();
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};
