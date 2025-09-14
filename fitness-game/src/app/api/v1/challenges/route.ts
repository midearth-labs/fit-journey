import { NextRequest } from 'next/server';
import { withAuth } from '../shared/middleware/auth-context';
import { withErrorHandling } from '../shared/utils/error-handler';
import { createSuccessResponse } from '../shared/utils/response-formatter';
import { ServiceFactory } from '../shared/services/service-factory';
import { GetAllChallengesRequestSchema } from '../shared/schemas/request';
import { ChallengeListApiResponseSchema } from '../shared/schemas/response';
import { AuthRequestContext } from '@/shared/interfaces';

/**
 * GET /api/v1/challenges
 * Get all available challenges
 */
async function handleGetAllChallenges(
  request: NextRequest,
  authContext: AuthRequestContext
) {
  // Validate request (no body for GET request)
  const validatedRequest = GetAllChallengesRequestSchema.parse({});
  
  // Get service instance
  const challengeContentService = (await ServiceFactory.getInstance()).getChallengeContentService();
  
  // Call service method
  const challenges = challengeContentService.getAllChallenges(validatedRequest, authContext);
  
  // Validate response data
  const validatedResponse = ChallengeListApiResponseSchema.parse({
    success: true,
    data: challenges,
  });
  
  return createSuccessResponse(challenges, 'Challenges retrieved successfully');
}

export const GET = withErrorHandling(withAuth(handleGetAllChallenges));
