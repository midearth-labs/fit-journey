import { NextRequest } from 'next/server';
import { withAuth } from '../../../../shared/middleware/auth-context';
import { withErrorHandling } from '../../../../shared/utils/error-handler';
import { createEmptySuccessResponse } from '../../../../shared/utils/response-formatter';
import { ServiceFactory } from '../../../../shared/services/service-factory';
import { PutUserChallengeLogRequestSchema } from '../../../../shared/schemas/request';
import { AuthRequestContext } from '@/shared/interfaces';

/**
 * PUT /api/v1/user-challenges/[id]/logs/[date]
 * Create or update a habit log for a specific date
 */
async function handlePutUserChallengeLog(
  request: NextRequest,
  authContext: AuthRequestContext,
  { params }: { params: { id: string; date: string } }
) {
  // Parse and validate request body
  const body = await request.json();
  const validatedRequest = PutUserChallengeLogRequestSchema.parse({
    userChallengeId: params.id,
    logDate: params.date,
    values: body.values,
  });
  
  // Get service instance
  const challengeService = (await ServiceFactory.getInstance()).getChallengeService();
  
  // Call service method
  await challengeService.putUserChallengeLog(validatedRequest, authContext);
  
  return createEmptySuccessResponse('Habit log updated successfully');
}

export const PUT = withErrorHandling(withAuth(handlePutUserChallengeLog));
