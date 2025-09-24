import type { RequestHandler } from './$types';
import { UpdateChallengeOperationSchema } from '$lib/server/shared/schemas';
import { parseParams, parseBody, handleServiceError, noContent } from '$lib/server/shared/http';

export const PATCH: RequestHandler = async (event) => {
  try {
    const { challengeId } = parseParams(event, UpdateChallengeOperationSchema.request.params);
    const body = await parseBody(event, UpdateChallengeOperationSchema.request.body);
    const { challengesService } = event.locals.authServices!;
    await challengesService().updateChallenge({ challengeId, ...body });
    return noContent();
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};


