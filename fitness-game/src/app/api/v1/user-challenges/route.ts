import { NextRequest } from 'next/server';
import { withAuth } from '../shared/middleware/auth-context';
import { withErrorHandling } from '../shared/utils/error-handler';
import { createSuccessResponse, createCreatedResponse } from '../shared/utils/response-formatter';
import { ServiceFactory } from '../shared/services/service-factory';
import { 
  CreateUserChallengeRequestSchema,
  ListUserChallengesRequestSchema 
} from '../shared/schemas/request';
import { 
  NewUserChallengeApiResponseSchema,
  UserChallengeListApiResponseSchema 
} from '../shared/schemas/response';
import { AuthRequestContext } from '@/shared/interfaces';

/**
 * GET /api/v1/user-challenges
 * List all user challenges for the authenticated user
 */
async function handleListUserChallenges(
  request: NextRequest,
  authContext: AuthRequestContext
) {
  // Validate request (no body for GET request)
  const validatedRequest = ListUserChallengesRequestSchema.parse({});
  
  // Get service instance
  const challengeService = (await ServiceFactory.getInstance()).getChallengeService();
  
  // Call service method
  const userChallenges = await challengeService.listUserChallenges(validatedRequest, authContext);
  
  // Validate response data
  const validatedResponse = UserChallengeListApiResponseSchema.parse({
    success: true,
    data: userChallenges,
  });
  
  return createSuccessResponse(userChallenges, 'User challenges retrieved successfully');
}

/**
 * POST /api/v1/user-challenges
 * Create a new user challenge
 */
async function handleCreateUserChallenge(
  request: NextRequest,
  authContext: AuthRequestContext
) {
  // Parse and validate request body
  const body = await request.json();
  const validatedRequest = CreateUserChallengeRequestSchema.parse(body);
  
  // Get service instance
  const challengeService = (await ServiceFactory.getInstance()).getChallengeService();
  
  // Call service method
  const newChallenge = await challengeService.createUserChallenge(validatedRequest, authContext);
  
  // Validate response data
  const validatedResponse = NewUserChallengeApiResponseSchema.parse({
    success: true,
    data: newChallenge,
  });
  
  return createCreatedResponse(newChallenge, 'User challenge created successfully');
}

export const GET = withErrorHandling(withAuth(handleListUserChallenges));
export const POST = withErrorHandling(withAuth(handleCreateUserChallenge));
