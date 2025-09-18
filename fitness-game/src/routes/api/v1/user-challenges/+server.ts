import type { RequestHandler } from './$types';
import { CreateUserChallengeDtoSchema, NewUserChallengeResponseSchema } from '$lib/server/shared/schemas';
import { parseBody, handleServiceError, validateAndReturn } from '$lib/server/shared/http';

export const POST: RequestHandler = async (event) => {
  try {
    // Parse and validate request body
    const dto = await parseBody(event, CreateUserChallengeDtoSchema);
    
    // Get authenticated services (guaranteed to exist in protected /api/v1 routes)
    const { challengeService } = event.locals.authServices!;
    
    // Call service
    const result = await challengeService().createUserChallenge(dto);
    
    // Validate response and return
    return validateAndReturn(result, NewUserChallengeResponseSchema);
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};

export const GET: RequestHandler = async (event) => {
  try {
    // Get authenticated services (guaranteed to exist in protected /api/v1 routes)
    const { challengeService } = event.locals.authServices!;
    
    // Call service
    const challenges = await challengeService().listUserChallenges({});
    
    // Validate response and return
    return validateAndReturn(challenges, NewUserChallengeResponseSchema.array());
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};
