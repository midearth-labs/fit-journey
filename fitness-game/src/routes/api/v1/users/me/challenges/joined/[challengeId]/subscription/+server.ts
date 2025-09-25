import type { RequestHandler } from './$types';
import { GetChallengeJoinedByUserSubscriptionOperationSchema } from '$lib/server/shared/schemas';
import { parseParams, handleServiceError, validateAndReturn } from '$lib/server/shared/http';

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
