import type { RequestHandler } from './$types';
import { GetQuestionParamsSchema, QuestionResponseSchema } from '$lib/server/shared/schemas';
import { parseParams, handleServiceError, validateAndReturn } from '$lib/server/shared/http';

export const GET: RequestHandler = async (event) => {
  try {
    const { questionId } = parseParams(event, GetQuestionParamsSchema);
    const { questionsService } = event.locals.authServices!;
    const question = await questionsService().getQuestion({ questionId });
    return validateAndReturn(question, QuestionResponseSchema);
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};
