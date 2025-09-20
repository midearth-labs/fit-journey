import type { RequestHandler } from './$types';
import { SubmitUserChallengeQuizOperationSchema } from '$lib/server/shared/schemas';
import { parseBody, parseParams, handleServiceError, noContent } from '$lib/server/shared/http';

export const POST: RequestHandler = async (event) => {
  try {
    // Parse route parameters
    const { userChallengeId, knowledgeBaseId } = parseParams(event, SubmitUserChallengeQuizOperationSchema.request.params);
    
    // Parse request body
    const body = await parseBody(event, SubmitUserChallengeQuizOperationSchema.request.body);
    
    // Get authenticated services (guaranteed to exist in protected /api/v1 routes)
    const { challengeProgressService } = event.locals.authServices!;
    
    // Call service with combined DTO
    await challengeProgressService().submitUserChallengeQuiz({
      userChallengeId,
      knowledgeBaseId,
      quizAnswers: body.quizAnswers,
      overrideSubmission: body.overrideSubmission
    });
    
    // Return 204 No Content for successful submission
    return noContent();
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};
