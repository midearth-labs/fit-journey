import { json, error } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { ValidationError } from './errors';

/**
 * Parse request body as JSON and validate with Zod schema
 */
export async function parseBody<T>(event: RequestEvent, schema: { parse: (data: unknown) => T }): Promise<T> {
  try {
    const body = await event.request.json();
    return schema.parse(body);
  } catch (err: any) {
    if (err && 'issues' in err) {
      // Zod validation error
      throw error(400, `Validation failed: ${JSON.stringify(err.issues)}`);
    }
    throw error(400, 'Invalid JSON body');
  }
}

/**
 * Parse URL search parameters and validate with Zod schema
 */
export function parseQuery<T>(event: RequestEvent, schema: { parse: (data: unknown) => T }): T {
  try {
    const url = new URL(event.request.url);
    const params = Object.fromEntries(url.searchParams.entries());
    return schema.parse(params);
  } catch (err: any) {
    if (err && 'issues' in err) {
      // Zod validation error
      throw error(400, `Invalid query parameters: ${JSON.stringify(err.issues)}`);
    }
    throw error(400, 'Invalid query parameters');
  }
}

/**
 * Parse route parameters and validate with Zod schema
 */
export function parseParams<T>(event: RequestEvent, schema: { parse: (data: unknown) => T }): T {
  try {
    return schema.parse(event.params);
  } catch (err: any) {
    if (err && 'issues' in err) {
      // Zod validation error
      throw error(400, `Invalid route parameters: ${JSON.stringify(err.issues)}`);
    }
    throw error(400, 'Invalid route parameters');
  }
}

/**
 * Handle service errors and convert to HTTP responses
 */
export function handleServiceError(err: unknown, requestId?: string): never {
  if (err instanceof ValidationError) {
    throw error(400, err.message);
  }

  // Log unexpected errors (in production, you'd want proper logging)
  console.error('Unexpected service error:', err);

  throw error(500, 'Internal server error');
}

/**
 * Return successful JSON response
 */
export function jsonOk<T>(data: T) {
  return json(data);
}

/**
 * Return successful response with no content
 */
export function noContent() {
  return new Response(null, { status: 204 });
}

/**
 * Validate response data against schema before returning
 */
// @TODO: check we need schema response validation here
export function validateAndReturn<T>(data: T, schema: { parse: (data: unknown) => T }) {
  try {
    //const validated = schema.parse(data);
    // return jsonOk(validated);
    return jsonOk(data);
  } catch (err) {
    console.error('Response validation failed:', err);
    throw error(500, 'Response validation failed');
  }
}
