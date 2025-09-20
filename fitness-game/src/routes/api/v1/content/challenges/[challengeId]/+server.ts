import type { RequestHandler } from './$types';
import { GetChallengeOperationSchema } from '$lib/server/shared/schemas';
import { parseParams, handleServiceError, validateAndReturn } from '$lib/server/shared/http';

export const GET: RequestHandler = async (event) => {
  try {
    // Parse route parameters
    const { challengeId } = parseParams(event, GetChallengeOperationSchema.request.params);
    
    // Get authenticated services (guaranteed to exist in protected /api/v1 routes)
    const { challengeContentService } = event.locals.authServices!;
    
    // Call service
    const challenge = challengeContentService().getChallengeById({ challengeId });
    
    // Return challenge with validation
    return validateAndReturn(challenge, GetChallengeOperationSchema.response.body);
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};
