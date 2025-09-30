import type { RequestHandler } from './$types';
import { SubmitQuestionOperationSchema, ListQuestionsOperationSchema } from '$lib/server/shared/schemas';
import { parseBody, parseQuery, handleServiceError, validateAndReturn } from '$lib/server/shared/http';

export const POST: RequestHandler = async (event) => {
  try {
    const dto = await parseBody(event, SubmitQuestionOperationSchema.request.body);
    const { questionsService } = event.locals.authServices!;
    const question = await questionsService().submitQuestion(dto);
    return validateAndReturn(question, SubmitQuestionOperationSchema.response.body);
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};

export const GET: RequestHandler = async (event) => {
  try {
    const dto = parseQuery(event, ListQuestionsOperationSchema.request.query);
    const { questionsService } = event.locals.authServices!;
    const questions = await questionsService().listQuestions({...dto, page: dto.page!, limit: dto.limit!});
    return validateAndReturn(questions, ListQuestionsOperationSchema.response.body);
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};
