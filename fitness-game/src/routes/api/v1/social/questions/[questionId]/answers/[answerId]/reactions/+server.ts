import type { RequestHandler } from './$types';
import { AddAnswerReactionOperationSchema } from '$lib/server/shared/schemas';
import { parseBody, parseParams, handleServiceError, noContent } from '$lib/server/shared/http';

export const POST: RequestHandler = async (event) => {
  try {
    const { questionId, answerId } = parseParams(event, AddAnswerReactionOperationSchema.request.params);
    const body = await parseBody(event, AddAnswerReactionOperationSchema.request.body);
    const { answersService } = event.locals.authServices!;
    await answersService().addReaction({ questionId, answerId, reactionType: body.reactionType });
    return noContent();
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};


