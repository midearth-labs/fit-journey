import type { RequestHandler } from './$types';
import { CreateChallengeOperationSchema } from '$lib/server/shared/schemas';
import { parseBody, handleServiceError, validateAndReturn } from '$lib/server/shared/http';

export const POST: RequestHandler = async (event) => {
  try {
    const dto = await parseBody(event, CreateChallengeOperationSchema.request.body);
    const { challengesService } = event.locals.authServices!;
    const created = await challengesService().createChallenge(dto);
    return validateAndReturn(created, CreateChallengeOperationSchema.response.body);
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};


