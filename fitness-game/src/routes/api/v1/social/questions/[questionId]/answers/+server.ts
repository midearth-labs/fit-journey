import type { RequestHandler } from './$types';
import { SubmitAnswerOperationSchema, ListAnswersOperationSchema } from '$lib/server/shared/schemas';
import { parseBody, parseQuery, parseParams, handleServiceError, validateAndReturn, noContent } from '$lib/server/shared/http';

export const POST: RequestHandler = async (event) => {
  try {
    const { questionId } = parseParams(event, SubmitAnswerOperationSchema.request.params);
    const { answer, isAnonymous } = await parseBody(event, SubmitAnswerOperationSchema.request.body);
    const { answersService } = event.locals.authServices!;
    
    const answerResponse = await answersService().submitAnswer({ questionId, answer, isAnonymous });
    return validateAndReturn(answerResponse, SubmitAnswerOperationSchema.response.body);
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};

export const GET: RequestHandler = async (event) => {
  try {
    const { questionId } = parseParams(event, ListAnswersOperationSchema.request.params);
    const {  page, limit  } = parseQuery(event, ListAnswersOperationSchema.request.query);
    const { answersService } = event.locals.authServices!;
    
    const answers = await answersService().listAnswers({ questionId,  page: page!, limit: limit!  });
    return validateAndReturn(answers, ListAnswersOperationSchema.response.body);
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};
