import type { RequestHandler } from './$types';
import { SubmitAnswerDtoSchema, ListAnswersQuerySchema, AnswerResponseSchema } from '$lib/server/shared/schemas';
import { parseBody, parseQuery, parseParams, handleServiceError, validateAndReturn, noContent } from '$lib/server/shared/http';
import { z } from 'zod';
import { UuidSchema } from '$lib/server/shared/z.primitives';

const QuestionIdParamsSchema = z.object({ questionId: UuidSchema });

export const POST: RequestHandler = async (event) => {
  try {
    const { questionId } = parseParams(event, QuestionIdParamsSchema);
    const { answer, isAnonymous } = await parseBody(event, SubmitAnswerDtoSchema);
    const { answersService } = event.locals.authServices!;
    
    await answersService().submitAnswer({ questionId, answer, isAnonymous });
    return noContent();
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};

export const GET: RequestHandler = async (event) => {
  try {
    const { questionId } = parseParams(event, QuestionIdParamsSchema);
    const { page, limit } = parseQuery(event, ListAnswersQuerySchema);
    const { answersService } = event.locals.authServices!;
    
    const answers = await answersService().listAnswers({ questionId, page, limit });
    return validateAndReturn(answers, AnswerResponseSchema.array());
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};
