import type { RequestHandler } from './$types';
import { ListChallengesJoinedByUserOperationSchema } from '$lib/server/shared/schemas';
import { parseQuery, handleServiceError, validateAndReturn } from '$lib/server/shared/http';

export const GET: RequestHandler = async (event) => {
  try {
    const {  page, limit  } = parseQuery(event, ListChallengesJoinedByUserOperationSchema.request.query);
    const { challengesService } = event.locals.authServices!;
    const challenges = await challengesService().listChallengesJoinedByUser({  page: page!, limit: limit!  });
    return validateAndReturn(challenges, ListChallengesJoinedByUserOperationSchema.response.body);
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};
