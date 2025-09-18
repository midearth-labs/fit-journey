import type { RequestHandler } from './$types';
import { z } from 'zod';
import { UuidSchema } from '$lib/server/shared/z.primitives';
import { SubmitUserChallengeQuizDtoSchema } from '$lib/server/shared/schemas';
import { parseBody, parseParams, handleServiceError, noContent } from '$lib/server/shared/http';

// Schema for route parameters
const QuizParamsSchema = z.object({
  userChallengeId: UuidSchema,
  knowledgeBaseId: UuidSchema
});

// Schema for request body (excluding path parameters)
const SubmitQuizBodySchema = SubmitUserChallengeQuizDtoSchema.omit({
  userChallengeId: true,
  knowledgeBaseId: true
});

export const POST: RequestHandler = async (event) => {
  try {
    // Parse route parameters
    const { userChallengeId, knowledgeBaseId } = parseParams(event, QuizParamsSchema);
    
    // Parse request body
    const body = await parseBody(event, SubmitQuizBodySchema);
    
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
