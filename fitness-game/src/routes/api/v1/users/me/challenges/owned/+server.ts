import type { RequestHandler } from './$types';
import { ListChallengesOwnedByUserOperationSchema } from '$lib/server/shared/schemas';
import { parseQuery, handleServiceError, validateAndReturn } from '$lib/server/shared/http';

export const GET: RequestHandler = async (event) => {
  try {
    const { page, limit } = parseQuery(event, ListChallengesOwnedByUserOperationSchema.request.query);
    const { challengesService } = event.locals.authServices!;
    const challenges = await challengesService().listChallengesOwnedByUser({ page, limit });
    return validateAndReturn(challenges, ListChallengesOwnedByUserOperationSchema.response.body);
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};
