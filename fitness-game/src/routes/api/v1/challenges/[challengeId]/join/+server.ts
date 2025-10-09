import type { RequestHandler } from './$types';
import { JoinChallengeOperationSchema } from '$lib/server/shared/schemas';
import { parseParams, parseBody, handleServiceError, validateAndReturn } from '$lib/server/shared/http';

export const POST: RequestHandler = async (event) => {
  try {
    const { challengeId } = parseParams(event, JoinChallengeOperationSchema.request.params);
    const body = await parseBody(event, JoinChallengeOperationSchema.request.body);
    const { challengesService } = event.locals.authServices!;
    const joined = await challengesService().joinChallenge({ challengeId, inviteCode: body.inviteCode, shareLogKeys: body.shareLogKeys });
    return validateAndReturn(joined, JoinChallengeOperationSchema.response.body);
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};


