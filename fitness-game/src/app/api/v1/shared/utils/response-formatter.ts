import { NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * Creates a standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message }),
    },
    { status }
  );
}

/**
 * Creates a standardized success response for created resources
 */
export function createCreatedResponse<T>(
  data: T,
  message?: string
): NextResponse {
  return createSuccessResponse(data, message, 201);
}

/**
 * Creates a standardized success response for empty operations (like updates/deletes)
 */
export function createEmptySuccessResponse(
  message?: string,
  status: number = 200
): NextResponse {
  return createSuccessResponse({}, message, status);
}

/**
 * Validates response data against a Zod schema
 */
export function validateResponseData<T>(
  data: T,
  schema: z.ZodType<T>
): T {
  return schema.parse(data);
}

/**
 * Creates a paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
  message?: string
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
      ...(message && { message }),
    },
    { status: 200 }
  );
}
