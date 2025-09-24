import type { RequestHandler } from './$types';
import { GetChallengeOperationSchema } from '$lib/server/shared/schemas';
import { parseParams, handleServiceError, validateAndReturn } from '$lib/server/shared/http';

export const GET: RequestHandler = async (event) => {
  try {
    const { challengeId } = parseParams(event, GetChallengeOperationSchema.request.params);
    const { challengesService } = event.locals.authServices!;
    const challenge = await challengesService().getChallenge({ challengeId });
    return validateAndReturn(challenge, GetChallengeOperationSchema.response.body);
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};


