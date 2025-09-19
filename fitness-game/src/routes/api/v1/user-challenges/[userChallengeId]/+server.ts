import type { RequestHandler } from './$types';
import { z } from 'zod';
import { UuidSchema } from '$lib/server/shared/z.primitives';
import { UserChallengeDetailResponseSchema } from '$lib/server/shared/schemas';
import { parseParams, handleServiceError, validateAndReturn, noContent } from '$lib/server/shared/http';

// Schema for route parameters
const UserChallengeParamsSchema = z.object({
  userChallengeId: UuidSchema
});

export const GET: RequestHandler = async (event) => {
  try {
    // Parse route parameters
    const { userChallengeId } = parseParams(event, UserChallengeParamsSchema);
    
    // Get authenticated services (guaranteed to exist in protected /api/v1 routes)
    const { challengeService } = event.locals.authServices!;
    
    // Call service
    const challenge = await challengeService().getUserChallenge({ userChallengeId });
    
    // Validate response and return
    return validateAndReturn(challenge, UserChallengeDetailResponseSchema);
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};

export const DELETE: RequestHandler = async (event) => {
  try {
    // Parse route parameters
    const { userChallengeId } = parseParams(event, UserChallengeParamsSchema);
    
    // Get authenticated services (guaranteed to exist in protected /api/v1 routes)
    const { challengeService } = event.locals.authServices!;
    
    // Call service to cancel the challenge
    await challengeService().cancelChallenge({ userChallengeId });
    
    // Return 204 No Content for successful cancellation
    return noContent();
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};
