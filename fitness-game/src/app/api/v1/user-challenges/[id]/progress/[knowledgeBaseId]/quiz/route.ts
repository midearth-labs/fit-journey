import { NextRequest } from 'next/server';
import { withAuth } from '../../../../../shared/middleware/auth-context';
import { withErrorHandling } from '../../../../../shared/utils/error-handler';
import { createEmptySuccessResponse } from '../../../../../shared/utils/response-formatter';
import { ServiceFactory } from '../../../../../shared/services/service-factory';
import { SubmitUserChallengeQuizRequestSchema } from '../../../../../shared/schemas/request';
import { AuthRequestContext } from '@/shared/interfaces';

/**
 * POST /api/v1/user-challenges/[id]/progress/[knowledgeBaseId]/quiz
 * Submit a quiz for a specific knowledge base article
 */
async function handleSubmitUserChallengeQuiz(
  request: NextRequest,
  authContext: AuthRequestContext,
  { params }: { params: { id: string; knowledgeBaseId: string } }
) {
  // Parse and validate request body
  const body = await request.json();
  const validatedRequest = SubmitUserChallengeQuizRequestSchema.parse({
    userChallengeId: params.id,
    knowledgeBaseId: params.knowledgeBaseId,
    quizAnswers: body.quizAnswers,
    overrideSubmission: body.overrideSubmission,
  });
  
  // Get service instance
  const challengeService = (await ServiceFactory.getInstance()).getChallengeService();
  
  // Call service method
  await challengeService.submitUserChallengeQuiz(validatedRequest, authContext);
  
  return createEmptySuccessResponse('Quiz submitted successfully');
}

export const POST = withErrorHandling(withAuth(handleSubmitUserChallengeQuiz));
