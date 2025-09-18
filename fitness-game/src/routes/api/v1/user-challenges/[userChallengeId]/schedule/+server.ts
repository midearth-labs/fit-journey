import type { RequestHandler } from './$types';
import { z } from 'zod';
import { UuidSchema, IsoDateSchema } from '$lib/server/shared/z.primitives';
import { parseBody, parseParams, handleServiceError, noContent } from '$lib/server/shared/http';

// Schema for route parameters
const UserChallengeParamsSchema = z.object({
  userChallengeId: UuidSchema
});

// Schema for request body
const UpdateUserChallengeScheduleDtoSchema = z.object({
  newStartDate: IsoDateSchema
});

export const PATCH: RequestHandler = async (event) => {
  try {
    // Parse route parameters
    const { userChallengeId } = parseParams(event, UserChallengeParamsSchema);
    
    // Parse request body
    const { newStartDate } = await parseBody(event, UpdateUserChallengeScheduleDtoSchema);
    
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
