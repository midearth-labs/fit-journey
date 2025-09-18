import type { RequestHandler } from './$types';
import { z } from 'zod';
import { UuidSchema } from '$lib/server/shared/z.primitives';
import { ListUserChallengeQuizSubmissionsDtoSchema, UserChallengeProgressResponseSchema } from '$lib/server/shared/schemas';
import { parseQuery, parseParams, handleServiceError, validateAndReturn } from '$lib/server/shared/http';

// Schema for route parameters
const UserChallengeParamsSchema = z.object({
  userChallengeId: UuidSchema
});

export const GET: RequestHandler = async (event) => {
  try {
    // Parse route parameters
    const { userChallengeId } = parseParams(event, UserChallengeParamsSchema);
    
    // Parse query parameters
    const queryParams = parseQuery(event, ListUserChallengeQuizSubmissionsDtoSchema.omit({
      userChallengeId: true
    }));
    
    // Get authenticated services (guaranteed to exist in protected /api/v1 routes)
    const { challengeProgressService } = event.locals.authServices!;
    
    // Call service with combined DTO
    const submissions = await challengeProgressService().listUserChallengeQuizSubmissions({
      userChallengeId,
      fromDate: queryParams.fromDate,
      toDate: queryParams.toDate
    });
    
    // Validate response and return
    return validateAndReturn(submissions, UserChallengeProgressResponseSchema.array());
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};
