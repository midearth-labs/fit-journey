import type { RequestHandler } from './$types';
import { GetUserMetadataOperationSchema } from '$lib/server/shared/schemas';
import { handleServiceError, validateAndReturn } from '$lib/server/shared/http';

export const GET: RequestHandler = async (event) => {
  try {
    // Get authenticated services (guaranteed to exist in protected /api/v1 routes)
    const { userMetadataService } = event.locals.authServices!;
    
    // Call service to get user metadata
    const metadata = await userMetadataService().getUserMetadata();
    
    // Return validated metadata data
    return validateAndReturn(metadata, GetUserMetadataOperationSchema.response.body);
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};
