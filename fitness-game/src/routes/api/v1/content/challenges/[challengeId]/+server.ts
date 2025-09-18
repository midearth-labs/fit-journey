import type { RequestHandler } from './$types';
import { z } from 'zod';
import { UuidSchema } from '$lib/server/shared/z.primitives';
import { parseParams, handleServiceError, jsonOk } from '$lib/server/shared/http';

// Schema for route parameters
const ChallengeParamsSchema = z.object({
  challengeId: UuidSchema
});

export const GET: RequestHandler = async (event) => {
  try {
    // Parse route parameters
    const { challengeId } = parseParams(event, ChallengeParamsSchema);
    
    // Get authenticated services (guaranteed to exist in protected /api/v1 routes)
    const { challengeContentService } = event.locals.authServices!;
    
    // Call service
    const challenge = challengeContentService().getChallengeById({ challengeId });
    
    // Return challenge (no validation needed as it's content data)
    return jsonOk(challenge);
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};
