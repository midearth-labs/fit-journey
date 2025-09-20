import type { RequestHandler } from './$types';
import { GetUserChallengeOperationSchema, CancelUserChallengeOperationSchema } from '$lib/server/shared/schemas';
import { parseParams, handleServiceError, validateAndReturn, noContent } from '$lib/server/shared/http';

export const GET: RequestHandler = async (event) => {
  try {
    // Parse route parameters
    const { userChallengeId } = parseParams(event, GetUserChallengeOperationSchema.request.params);
    
    // Get authenticated services (guaranteed to exist in protected /api/v1 routes)
    const { challengeService } = event.locals.authServices!;
    
    // Call service
    const challenge = await challengeService().getUserChallenge({ userChallengeId });
    
    // Validate response and return
    return validateAndReturn(challenge, GetUserChallengeOperationSchema.response.body);
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};

export const DELETE: RequestHandler = async (event) => {
  try {
    // Parse route parameters
    const { userChallengeId } = parseParams(event, CancelUserChallengeOperationSchema.request.params);
    
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
