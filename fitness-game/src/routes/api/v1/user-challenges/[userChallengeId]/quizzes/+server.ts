import type { RequestHandler } from './$types';
import { ListUserChallengeQuizSubmissionsOperationSchema } from '$lib/server/shared/schemas';
import { parseQuery, parseParams, handleServiceError, validateAndReturn } from '$lib/server/shared/http';

export const GET: RequestHandler = async (event) => {
  try {
    // Parse route parameters
    const { userChallengeId } = parseParams(event, ListUserChallengeQuizSubmissionsOperationSchema.request.params);
    
    // Parse query parameters
    const queryParams = parseQuery(event, ListUserChallengeQuizSubmissionsOperationSchema.request.query);
    
    // Get authenticated services (guaranteed to exist in protected /api/v1 routes)
    const { challengeProgressService } = event.locals.authServices!;
    
    // Call service with combined DTO
    const submissions = await challengeProgressService().listUserChallengeQuizSubmissions({
      userChallengeId,
      fromDate: queryParams.fromDate,
      toDate: queryParams.toDate
    });
    
    // Validate response and return
    return validateAndReturn(submissions, ListUserChallengeQuizSubmissionsOperationSchema.response.body);
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};
