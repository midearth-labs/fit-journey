import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { 
  ResourceNotFoundError, 
  ValidationError, 
  InternalServerError 
} from '@/shared/errors';

/**
 * Standard error response format
 */
export interface ErrorResponse {
  success: false;
  error: string;
  message?: string;
  details?: any;
}

/**
 * Maps application errors to HTTP status codes
 */
export function getHttpStatusFromError(error: Error): number {
  if (error instanceof ResourceNotFoundError) {
    return 404;
  }
  if (error instanceof ValidationError) {
    return 400;
  }
  if (error instanceof InternalServerError) {
    return 500;
  }
  if (error instanceof ZodError) {
    return 400;
  }
  return 500;
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(error: Error): NextResponse<ErrorResponse> {
  const status = getHttpStatusFromError(error);
  
  let errorMessage = 'An unexpected error occurred';
  let details: any = undefined;
  
  if (error instanceof ZodError) {
    errorMessage = 'Validation error';
    details = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
    }));
  } else if (error instanceof ValidationError) {
    errorMessage = error.message;
  } else if (error instanceof ResourceNotFoundError) {
    errorMessage = error.message;
  } else if (error instanceof InternalServerError) {
    errorMessage = error.message;
  } else {
    // Log unexpected errors for debugging
    console.error('Unexpected error:', error);
  }
  
  return NextResponse.json(
    {
      success: false,
      error: errorMessage,
      details,
    },
    { status }
  );
}

/**
 * Wraps API route handlers with error handling
 */
export function withErrorHandling<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return createErrorResponse(error as Error);
    }
  };
}
