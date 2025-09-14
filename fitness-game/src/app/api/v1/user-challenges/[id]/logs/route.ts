import { NextRequest } from 'next/server';
import { withAuth } from '../../../shared/middleware/auth-context';
import { withErrorHandling } from '../../../shared/utils/error-handler';
import { createSuccessResponse } from '../../../shared/utils/response-formatter';
import { ServiceFactory } from '../../../shared/services/service-factory';
import { 
  ListUserChallengeLogsRequestSchema,
  ListUserChallengeLogsQuerySchema 
} from '../../../shared/schemas/request';
import { UserHabitLogListApiResponseSchema } from '../../../shared/schemas/response';
import { AuthRequestContext } from '@/shared/interfaces';

/**
 * GET /api/v1/user-challenges/[id]/logs
 * List habit logs for a user challenge
 */
async function handleListUserChallengeLogs(
  request: NextRequest,
  authContext: AuthRequestContext,
  { params }: { params: { id: string } }
) {
  // Parse and validate query parameters
  const url = new URL(request.url);
  const queryParams = {
    fromDate: url.searchParams.get('fromDate') || undefined,
    toDate: url.searchParams.get('toDate') || undefined,
  };
  
  const validatedQuery = ListUserChallengeLogsQuerySchema.parse(queryParams);
  
  // Validate request parameters
  const validatedRequest = ListUserChallengeLogsRequestSchema.parse({
    userChallengeId: params.id,
    fromDate: validatedQuery.fromDate,
    toDate: validatedQuery.toDate,
  });
  
  // Get service instance
  const challengeService = (await ServiceFactory.getInstance()).getChallengeService();
  
  // Call service method
  const logs = await challengeService.listUserChallengeLogs(validatedRequest, authContext);
  
  // Validate response data
  const validatedResponse = UserHabitLogListApiResponseSchema.parse({
    success: true,
    data: logs,
  });
  
  return createSuccessResponse(logs, 'User challenge logs retrieved successfully');
}

export const GET = withErrorHandling(withAuth(handleListUserChallengeLogs));
