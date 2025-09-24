import type { RequestHandler } from './$types';
import { LeaveChallengeOperationSchema } from '$lib/server/shared/schemas';
import { parseParams, handleServiceError, noContent } from '$lib/server/shared/http';

export const POST: RequestHandler = async (event) => {
  try {
    const { challengeId } = parseParams(event, LeaveChallengeOperationSchema.request.params);
    const { challengesService } = event.locals.authServices!;
    await challengesService().leaveChallenge({ challengeId });
    return noContent();
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};


