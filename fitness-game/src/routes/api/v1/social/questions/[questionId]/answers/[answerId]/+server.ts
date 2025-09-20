import type { RequestHandler } from './$types';
import { GetAnswerOperationSchema } from '$lib/server/shared/schemas';
import { parseParams, handleServiceError, validateAndReturn } from '$lib/server/shared/http';

export const GET: RequestHandler = async (event) => {
  try {
    const { questionId, answerId } = parseParams(event, GetAnswerOperationSchema.request.params);
    const { answersService } = event.locals.authServices!;
    const answer = await answersService().getAnswer({ questionId, answerId });
    return validateAndReturn(answer, GetAnswerOperationSchema.response.body);
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};
