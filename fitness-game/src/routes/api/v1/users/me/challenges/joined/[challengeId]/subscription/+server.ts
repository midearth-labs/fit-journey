import type { RequestHandler } from './$types';
import { GetChallengeJoinedByUserSubscriptionOperationSchema, UpdateChallengeJoinedByUserSubscriptionOperationSchema } from '$lib/server/shared/schemas';
import { parseParams, parseBody, handleServiceError, validateAndReturn, noContent } from '$lib/server/shared/http';

export const GET: RequestHandler = async (event) => {
  try {
    const { challengeId } = parseParams(event, GetChallengeJoinedByUserSubscriptionOperationSchema.request.params);
    const { challengesService } = event.locals.authServices!;
    const subscription = await challengesService().getChallengeJoinedByUserSubscription({ challengeId });
    return validateAndReturn(subscription, GetChallengeJoinedByUserSubscriptionOperationSchema.response.body);
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};

export const PATCH: RequestHandler = async (event) => {
  try {
    const { challengeId } = parseParams(event, UpdateChallengeJoinedByUserSubscriptionOperationSchema.request.params);
    const body = await parseBody(event, UpdateChallengeJoinedByUserSubscriptionOperationSchema.request.body);
    const { challengesService } = event.locals.authServices!;
    await challengesService().updateChallengeJoinedByUserSubscription({ challengeId, shareLogKeys: body.shareLogKeys });
    return noContent();
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};
