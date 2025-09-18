import type { RequestHandler } from './$types';
import { handleServiceError, jsonOk } from '$lib/server/shared/http';

export const GET: RequestHandler = async (event) => {
  try {
    // Get authenticated services (guaranteed to exist in protected /api/v1 routes)
    const { challengeContentService } = event.locals.authServices!;
    
    // Call service
    const challenges = challengeContentService().listAllChallenges({});
    
    // Return challenges (no validation needed as it's content data)
    return jsonOk(challenges);
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};
