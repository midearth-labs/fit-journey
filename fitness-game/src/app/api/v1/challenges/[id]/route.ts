import { NextRequest } from 'next/server';
import { withAuth } from '../../shared/middleware/auth-context';
import { withErrorHandling } from '../../shared/utils/error-handler';
import { createSuccessResponse } from '../../shared/utils/response-formatter';
import { ServiceFactory } from '../../shared/services/service-factory';
import { GetChallengeByIdRequestSchema } from '../../shared/schemas/request';
import { ChallengeApiResponseSchema } from '../../shared/schemas/response';
import { AuthRequestContext } from '@/shared/interfaces';

/**
 * GET /api/v1/challenges/[id]
 * Get a specific challenge by ID
 */
async function handleGetChallengeById(
  request: NextRequest,
  authContext: AuthRequestContext,
  { params }: { params: { id: string } }
) {
  // Validate request parameters
  const validatedRequest = GetChallengeByIdRequestSchema.parse({
    challengeId: params.id,
  });
  
  // Get service instance
  const challengeContentService = (await ServiceFactory.getInstance()).getChallengeContentService();
  
  // Call service method
  const challenge = challengeContentService.getChallengeById(validatedRequest, authContext);
  
  // Validate response data
  const validatedResponse = ChallengeApiResponseSchema.parse({
    success: true,
    data: challenge,
  });
  
  return createSuccessResponse(challenge, 'Challenge retrieved successfully');
}

export const GET = withErrorHandling(withAuth(handleGetChallengeById));
