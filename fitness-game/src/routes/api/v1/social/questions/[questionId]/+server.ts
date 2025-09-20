import type { RequestHandler } from './$types';
import { GetQuestionOperationSchema } from '$lib/server/shared/schemas';
import { parseParams, handleServiceError, validateAndReturn } from '$lib/server/shared/http';

export const GET: RequestHandler = async (event) => {
  try {
    const { questionId } = parseParams(event, GetQuestionOperationSchema.request.params);
    const { questionsService } = event.locals.authServices!;
    const question = await questionsService().getQuestion({ questionId });
    return validateAndReturn(question, GetQuestionOperationSchema.response.body);
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};
