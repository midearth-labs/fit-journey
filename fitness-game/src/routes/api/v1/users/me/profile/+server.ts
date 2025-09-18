import type { RequestHandler } from './$types';
import { UpdateUserProfileDtoSchema, UserProfileResponseSchema } from '$lib/server/shared/schemas';
import { parseBody, handleServiceError, noContent, validateAndReturn } from '$lib/server/shared/http';

export const GET: RequestHandler = async (event) => {
  try {
    // Get authenticated services (guaranteed to exist in protected /api/v1 routes)
    const { userProfileService } = event.locals.authServices!;
    
    // Call service to get user profile
    const profile = await userProfileService().getUserProfile();
    
    // Return validated profile data
    return validateAndReturn(profile, UserProfileResponseSchema);
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};

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
