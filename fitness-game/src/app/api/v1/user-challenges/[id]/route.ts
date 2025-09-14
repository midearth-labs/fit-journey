import { NextRequest } from 'next/server';
import { withAuth } from '../../shared/middleware/auth-context';
import { withErrorHandling } from '../../shared/utils/error-handler';
import { createSuccessResponse } from '../../shared/utils/response-formatter';
import { ServiceFactory } from '../../shared/services/service-factory';
import { GetUserChallengeRequestSchema } from '../../shared/schemas/request';
import { UserChallengeDetailApiResponseSchema } from '../../shared/schemas/response';
import { AuthRequestContext } from '@/shared/interfaces';

/**
 * GET /api/v1/user-challenges/[id]
 * Get a specific user challenge by ID
 */
async function handleGetUserChallenge(
  request: NextRequest,
  authContext: AuthRequestContext,
  { params }: { params: { id: string } }
) {
  // Validate request parameters
  const validatedRequest = GetUserChallengeRequestSchema.parse({
    userChallengeId: params.id,
  });
  
  // Get service instance
  const challengeService = (await ServiceFactory.getInstance()).getChallengeService();
  
  // Call service method
  const userChallenge = await challengeService.getUserChallenge(validatedRequest, authContext);
  
  // Validate response data
  const validatedResponse = UserChallengeDetailApiResponseSchema.parse({
    success: true,
    data: userChallenge,
  });
  
  return createSuccessResponse(userChallenge, 'User challenge retrieved successfully');
}

export const GET = withErrorHandling(withAuth(handleGetUserChallenge));
