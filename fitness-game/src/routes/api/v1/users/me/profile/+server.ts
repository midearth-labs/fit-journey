import type { RequestHandler } from './$types';
import { UpdateUserProfileDtoSchema } from '$lib/server/shared/schemas';
import { parseBody, handleServiceError, noContent } from '$lib/server/shared/http';

export const PATCH: RequestHandler = async (event) => {
  try {
    // Parse and validate request body
    const dto = await parseBody(event, UpdateUserProfileDtoSchema);
    
    // Get authenticated services (guaranteed to exist in protected /api/v1 routes)
    const { userProfileService } = event.locals.authServices!;
    
    // Call service
    await userProfileService().updateUserProfile(dto);
    
    // Return 204 No Content for successful update
    return noContent();
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};
