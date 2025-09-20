import type { RequestHandler } from './$types';
import { AddQuestionReactionOperationSchema } from '$lib/server/shared/schemas';
import { parseBody, parseParams, handleServiceError, noContent } from '$lib/server/shared/http';

export const POST: RequestHandler = async (event) => {
  try {
    const { questionId } = parseParams(event, AddQuestionReactionOperationSchema.request.params);
    const { reactionType } = await parseBody(event, AddQuestionReactionOperationSchema.request.body);
    const { questionsService } = event.locals.authServices!;
    await questionsService().addReaction({ questionId, reactionType });
    return noContent();
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};
