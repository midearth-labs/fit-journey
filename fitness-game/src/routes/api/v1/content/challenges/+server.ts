import type { RequestHandler } from './$types';
import { ListChallengesOperationSchema } from '$lib/server/shared/schemas';
import { handleServiceError, validateAndReturn } from '$lib/server/shared/http';

export const GET: RequestHandler = async (event) => {
  try {
    // Get authenticated services (guaranteed to exist in protected /api/v1 routes)
    const { challengeContentService } = event.locals.authServices!;
    
    // Call service
    const challenges = challengeContentService().listAllChallenges({});
    
    // Return challenges with validation
    return validateAndReturn(challenges, ListChallengesOperationSchema.response.body);
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};
