import type { RequestHandler } from './$types';
import { ListPublicChallengesOperationSchema } from '$lib/server/shared/schemas';
import { parseQuery, handleServiceError, validateAndReturn } from '$lib/server/shared/http';

export const GET: RequestHandler = async (event) => {
  try {
    const {  page, limit  } = parseQuery(event, ListPublicChallengesOperationSchema.request.query);
    const { challengesService } = event.locals.authServices!;
    const list = await challengesService().listPublicChallenges({  page: page!, limit: limit!  });
    return validateAndReturn(list, ListPublicChallengesOperationSchema.response.body);
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};


