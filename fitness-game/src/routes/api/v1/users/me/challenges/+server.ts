import type { RequestHandler } from './$types';
import { CreateUserChallengeOperationSchema } from '$lib/server/shared/schemas';
import { parseBody, handleServiceError, validateAndReturn } from '$lib/server/shared/http';

export const POST: RequestHandler = async (event) => {
  try {
    const dto = await parseBody(event, CreateUserChallengeOperationSchema.request.body);
    const { challengesService } = event.locals.authServices!;
    const created = await challengesService().createUserChallenge(dto);
    return validateAndReturn(created, CreateUserChallengeOperationSchema.response.body);
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};


