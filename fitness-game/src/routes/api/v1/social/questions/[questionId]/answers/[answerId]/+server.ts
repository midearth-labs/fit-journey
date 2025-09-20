import type { RequestHandler } from './$types';
import { GetAnswerParamsSchema, AnswerResponseSchema } from '$lib/server/shared/schemas';
import { parseParams, handleServiceError, validateAndReturn } from '$lib/server/shared/http';

export const GET: RequestHandler = async (event) => {
  try {
    const { questionId, answerId } = parseParams(event, GetAnswerParamsSchema);
    const { answersService } = event.locals.authServices!;
    const answer = await answersService().getAnswer({ questionId, answerId });
    return validateAndReturn(answer, AnswerResponseSchema);
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};
