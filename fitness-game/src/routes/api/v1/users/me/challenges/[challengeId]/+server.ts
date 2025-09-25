import type { RequestHandler } from './$types';
import { UpdateUserChallengeOperationSchema, GetUserChallengeOperationSchema, DeleteUserChallengeOperationSchema } from '$lib/server/shared/schemas';
import { parseParams, parseBody, parseQuery, handleServiceError, noContent, validateAndReturn } from '$lib/server/shared/http';

export const GET: RequestHandler = async (event) => {
  try {
    const { challengeId } = parseParams(event, GetUserChallengeOperationSchema.request.params);
    const { challengesService } = event.locals.authServices!;
    const challenge = await challengesService().getUserChallenge({ challengeId });
    return validateAndReturn(challenge, GetUserChallengeOperationSchema.response.body);
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};

export const PATCH: RequestHandler = async (event) => {
  try {
    const { challengeId } = parseParams(event, UpdateUserChallengeOperationSchema.request.params);
    const body = await parseBody(event, UpdateUserChallengeOperationSchema.request.body);
    const { challengesService } = event.locals.authServices!;
    await challengesService().updateUserChallenge({ challengeId, ...body });
    return noContent();
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};

export const DELETE: RequestHandler = async (event) => {
  try {
    const { challengeId } = parseParams(event, DeleteUserChallengeOperationSchema.request.params);
    const { challengesService } = event.locals.authServices!;
    await challengesService().deleteUserChallenge({ challengeId });
    return noContent();
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};


