import type { RequestHandler } from './$types';
import { SubmitQuestionDtoSchema, ListQuestionsQuerySchema, QuestionResponseSchema, NewQuestionResponseSchema } from '$lib/server/shared/schemas';
import { parseBody, parseQuery, handleServiceError, validateAndReturn } from '$lib/server/shared/http';

export const POST: RequestHandler = async (event) => {
  try {
    const dto = await parseBody(event, SubmitQuestionDtoSchema);
    const { questionsService } = event.locals.authServices!;
    const question = await questionsService().submitQuestion(dto);
    return validateAndReturn(question, NewQuestionResponseSchema);
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};

export const GET: RequestHandler = async (event) => {
  try {
    const dto = parseQuery(event, ListQuestionsQuerySchema);
    const { questionsService } = event.locals.authServices!;
    const questions = await questionsService().listQuestions(dto);
    return validateAndReturn(questions, QuestionResponseSchema.array());
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};
