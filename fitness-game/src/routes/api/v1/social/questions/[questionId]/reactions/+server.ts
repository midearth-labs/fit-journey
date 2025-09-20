import type { RequestHandler } from './$types';
import { z } from 'zod';
import { UuidSchema, ReactionTypeSchema } from '$lib/server/shared/z.primitives';
import { parseBody, parseParams, handleServiceError, noContent } from '$lib/server/shared/http';

const QuestionIdParamsSchema = z.object({ questionId: UuidSchema });
const AddReactionBodySchema = z.object({ reactionType: ReactionTypeSchema });

export const POST: RequestHandler = async (event) => {
  try {
    const { questionId } = parseParams(event, QuestionIdParamsSchema);
    const { reactionType } = await parseBody(event, AddReactionBodySchema);
    const { questionsService } = event.locals.authServices!;
    await questionsService().addReaction({ questionId, reactionType });
    return noContent();
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};
