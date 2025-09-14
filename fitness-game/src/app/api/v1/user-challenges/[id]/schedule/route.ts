import { NextRequest } from 'next/server';
import { withAuth } from '../../../shared/middleware/auth-context';
import { withErrorHandling } from '../../../shared/utils/error-handler';
import { createEmptySuccessResponse } from '../../../shared/utils/response-formatter';
import { ServiceFactory } from '../../../shared/services/service-factory';
import { UpdateUserChallengeScheduleRequestSchema } from '../../../shared/schemas/request';
import { AuthRequestContext } from '@/shared/interfaces';

/**
 * PATCH /api/v1/user-challenges/[id]/schedule
 * Update the schedule of a user challenge
 */
async function handleUpdateUserChallengeSchedule(
  request: NextRequest,
  authContext: AuthRequestContext,
  { params }: { params: { id: string } }
) {
  // Parse and validate request body
  const body = await request.json();
  const validatedRequest = UpdateUserChallengeScheduleRequestSchema.parse({
    userChallengeId: params.id,
    newStartDate: body.newStartDate,
  });
  
  // Get service instance
  const challengeService = (await ServiceFactory.getInstance()).getChallengeService();
  
  // Call service method
  await challengeService.updateUserChallengeSchedule(validatedRequest, authContext);
  
  return createEmptySuccessResponse('User challenge schedule updated successfully');
}

export const PATCH = withErrorHandling(withAuth(handleUpdateUserChallengeSchedule));
