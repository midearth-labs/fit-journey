import type { RequestHandler } from './$types';
import { SubmitQuizOperationSchema } from '$lib/server/shared/schemas';
import { parseBody, parseParams, handleServiceError, noContent } from '$lib/server/shared/http';

export const POST: RequestHandler = async (event) => {
  try {
    const { articleId } = parseParams(event, SubmitQuizOperationSchema.request.params);
    const { quizAnswers } = await parseBody(event, SubmitQuizOperationSchema.request.body);
    const { articleService } = event.locals.authServices!;
    await articleService().submitQuiz({ articleId, quizAnswers });
    return noContent();
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};
