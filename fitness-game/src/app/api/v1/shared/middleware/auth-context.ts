import { NextRequest } from 'next/server';

import { AuthRequestContext } from '@/shared/interfaces';
import { AuthRequestContextSchema } from '../schemas/common';
import { createClient } from '@/utils/supabase/server';

/**
 * Extracts authentication context from the request
 * Throws an error if the user is not authenticated
 */
export async function extractAuthContext(request: NextRequest): Promise<AuthRequestContext> {
  const supabase = await createClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    console.log(error);
    throw new Error('Authentication required');
  }
  
  const authContext: AuthRequestContext = {
    requestDate: new Date(),
    userId: user.id,
  };
  
  // Validate the auth context with Zod
  return AuthRequestContextSchema.parse(authContext);
}

/**
 * Higher-order function that wraps API route handlers with authentication
 */
export function withAuth<T extends any[]>(
  handler: (request: NextRequest, authContext: AuthRequestContext, ...args: T) => Promise<Response>
) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    try {
      const authContext = await extractAuthContext(request);
      return await handler(request, authContext, ...args);
    } catch (error) {
      if (error instanceof Error && error.message === 'Authentication required') {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Authentication required',
            message: 'Please log in to access this resource',
          }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
      throw error;
    }
  };
}
