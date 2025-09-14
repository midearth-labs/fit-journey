import { NextRequest } from 'next/server';
import { withAuth } from '../../../shared/middleware/auth-context';
import { withErrorHandling } from '../../../shared/utils/error-handler';
import { createSuccessResponse } from '../../../shared/utils/response-formatter';
import { ServiceFactory } from '../../../shared/services/service-factory';
import { ListUserChallengeQuizSubmissionsRequestSchema } from '../../../shared/schemas/request';
import { UserChallengeProgressListApiResponseSchema } from '../../../shared/schemas/response';
import { AuthRequestContext } from '@/shared/interfaces';

/**
 * GET /api/v1/user-challenges/[id]/progress
 * List quiz submissions for a user challenge
 */
async function handleListUserChallengeQuizSubmissions(
  request: NextRequest,
  authContext: AuthRequestContext,
  { params }: { params: { id: string } }
) {
  // Validate request parameters
  const validatedRequest = ListUserChallengeQuizSubmissionsRequestSchema.parse({
    userChallengeId: params.id,
  });
  
  // Get service instance
  const challengeService = (await ServiceFactory.getInstance()).getChallengeService();
  
  // Call service method
  const submissions = await challengeService.listUserChallengeQuizSubmissions(validatedRequest, authContext);
  
  // Validate response data
  const validatedResponse = UserChallengeProgressListApiResponseSchema.parse({
    success: true,
    data: submissions,
  });
  
  return createSuccessResponse(submissions, 'Quiz submissions retrieved successfully');
}

export const GET = withErrorHandling(withAuth(handleListUserChallengeQuizSubmissions));
