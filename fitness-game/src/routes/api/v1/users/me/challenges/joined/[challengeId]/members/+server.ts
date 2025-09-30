import type { RequestHandler } from './$types';
import { ListChallengeJoinedByUserMembersOperationSchema } from '$lib/server/shared/schemas';
import { parseParams, parseQuery, handleServiceError, validateAndReturn } from '$lib/server/shared/http';

export const GET: RequestHandler = async (event) => {
  try {
    const { challengeId } = parseParams(event, ListChallengeJoinedByUserMembersOperationSchema.request.params);
    const {  page, limit  } = parseQuery(event, ListChallengeJoinedByUserMembersOperationSchema.request.query);
    const { challengesService } = event.locals.authServices!;
    const members = await challengesService().listChallengeJoinedByUserMembers({ challengeId,  page: page!, limit: limit!  });
    return validateAndReturn(members, ListChallengeJoinedByUserMembersOperationSchema.response.body);
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};
