# API Layer Implementation Guide (/api/v1)

This guide documents patterns for implementing SvelteKit API routes under `/api/v1`, wired to services in `$lib/server/services` and using Zod 4 for validation (`https://zod.dev/api`).

## Overview

- Routes under `/api/v1` are protected. You can safely use `event.locals.authServices!`.
- Each endpoint mirrors the REST path documented in the corresponding service method.
- Validate all inputs and outputs with Zod. Centralize schemas and helpers.

## File layout

Mirror REST paths with SvelteKit routing:
- `PATCH /users/me/profile` → `users/me/profile/+server.ts`
- `PUT /logs/:logDate` → `logs/[logDate]/+server.ts`
- `GET /logs?from&to&userChallengeId` → `logs/+server.ts`
- `POST /user-challenges` → `user-challenges/+server.ts`
- `GET /user-challenges` → `user-challenges/+server.ts`
- `GET /user-challenges/:userChallengeId` → `user-challenges/[userChallengeId]/+server.ts`
- `DELETE /user-challenges/:userChallengeId` → `user-challenges/[userChallengeId]/+server.ts`
- `PATCH /user-challenges/:userChallengeId/schedule` → `user-challenges/[userChallengeId]/schedule/+server.ts`
- `POST /user-challenges/:userChallengeId/quizzes/:knowledgeBaseId` → `user-challenges/[userChallengeId]/quizzes/[knowledgeBaseId]/+server.ts`
- `GET /user-challenges/:userChallengeId/quizzes` → `user-challenges/[userChallengeId]/quizzes/+server.ts`
- `GET /content/challenges/:challengeId` → `content/challenges/[challengeId]/+server.ts`
- `GET /content/challenges` → `content/challenges/+server.ts`

## Shared building blocks

- `$lib/server/shared/z.primitives.ts` – common Zod primitives (uuid, email, iso date, enums, etc.) using latest Zod APIs:
  - `z.uuid()`, `z.email()`, `z.iso.date()`
- `$lib/server/shared/schemas.ts` – DTO-aligned schemas composed from primitives; reuse via `.extend()/.omit()/.pick()`.
- `$lib/server/shared/http.ts` – helpers:
  - `parseBody(event, schema)` – JSON + Zod
  - `parseQuery(event, schema)` – URLSearchParams + Zod
  - `parseParams(event, schema)` – route params + Zod
  - `validateAndReturn(data, schema)` – response validation
  - `noContent()` – 204
  - `handleServiceError(err)` – maps `ValidationError` → 400, others → 500

## Handler pattern

- Thin handlers: validate → call service → return.
- Use the service factory per-request: `const { service } = event.locals.authServices!; service().method(dto)`.
- Writes without body return 204; reads return 200 with validated JSON.

### Example: PATCH /users/me/profile
```ts
import type { RequestHandler } from './$types';
import { UpdateUserProfileDtoSchema } from '$lib/server/shared/schemas';
import { parseBody, handleServiceError, noContent } from '$lib/server/shared/http';

export const PATCH: RequestHandler = async (event) => {
  try {
    const dto = await parseBody(event, UpdateUserProfileDtoSchema);
    const { userProfileService } = event.locals.authServices!;
    await userProfileService().updateUserProfile(dto);
    return noContent();
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};
```

### Example: PUT /logs/:logDate
```ts
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { IsoDateSchema } from '$lib/server/shared/z.primitives';
import { DailyLogPayloadSchema } from '$lib/server/shared/schemas';
import { parseBody, parseParams, handleServiceError, noContent } from '$lib/server/shared/http';

const LogDateParamsSchema = z.object({ logDate: IsoDateSchema });
const PutUserLogBodySchema = z.object({ values: DailyLogPayloadSchema });

export const PUT: RequestHandler = async (event) => {
  try {
    const { logDate } = parseParams(event, LogDateParamsSchema);
    const { values } = await parseBody(event, PutUserLogBodySchema);
    const { logService } = event.locals.authServices!;
    await logService().putUserLog({ logDate, values });
    return noContent();
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};
```

### Example: GET /logs
```ts
import type { RequestHandler } from './$types';
import { ListUserLogsQuerySchema, UserLogResponseSchema } from '$lib/server/shared/schemas';
import { parseQuery, handleServiceError, validateAndReturn } from '$lib/server/shared/http';

export const GET: RequestHandler = async (event) => {
  try {
    const dto = parseQuery(event, ListUserLogsQuerySchema);
    const { logService } = event.locals.authServices!;
    const logs = await logService().listUserLogs(dto);
    return validateAndReturn(logs, UserLogResponseSchema.array());
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};
```

### Example: DELETE /user-challenges/:userChallengeId
```ts
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { UuidSchema } from '$lib/server/shared/z.primitives';
import { parseParams, handleServiceError, noContent } from '$lib/server/shared/http';

const UserChallengeParamsSchema = z.object({
  userChallengeId: UuidSchema
});

export const DELETE: RequestHandler = async (event) => {
  try {
    const { userChallengeId } = parseParams(event, UserChallengeParamsSchema);
    const { challengeService } = event.locals.authServices!;
    await challengeService().cancelChallenge({ userChallengeId });
    return noContent();
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};
```

## Zod conventions

- Use latest helpers:
  - UUID → `z.uuid()`
  - Email → `z.email()`
  - ISO date → `z.iso.date()`
- Prefer composition and reuse via primitives and `.extend()`.
- Keep DTO semantics: `undefined` = ignore; `null` = clear.

## Response validation

- Validate responses for read endpoints to catch regressions early:
```ts
return validateAndReturn(result, SomeResponseSchema);
```

## API Client Integration

**CRITICAL**: Every new API endpoint MUST have a corresponding method in `src/client/api-client.ts`. This ensures the frontend can consume the API consistently.

### Adding API Client Methods

When creating a new endpoint, add the corresponding method to `ApiClient` class:

```typescript
// For GET endpoints
/** GET /endpoint/:param */
async getEndpoint(param: string): Promise<ResponseType> {
  return this.request<ResponseType>('/endpoint/:param', { method: 'GET' }, {
    params: { param }
  });
}

// For POST endpoints
/** POST /endpoint */
async createEndpoint(dto: CreateDto): Promise<ResponseType> {
  return this.request<ResponseType>('/endpoint', { 
    method: 'POST', 
    body: JSON.stringify(dto) 
  });
}

// For PATCH endpoints
/** PATCH /endpoint/:param */
async updateEndpoint(dto: UpdateDto): Promise<void> {
  await this.request<void>('/endpoint/:param', { 
    method: 'PATCH', 
    body: JSON.stringify(dto) 
  }, {
    params: { param: dto.param }
  });
}

// For DELETE endpoints
/** DELETE /endpoint/:param */
async deleteEndpoint(param: string): Promise<void> {
  await this.request<void>('/endpoint/:param', { method: 'DELETE' }, {
    params: { param }
  });
}
```

### API Client Method Conventions

- Use descriptive method names that match the HTTP verb and resource
- Include JSDoc comments with the HTTP method and path
- Use proper parameter substitution for path parameters
- Return appropriate types (void for writes, typed responses for reads)
- Handle query parameters via the `query` option
- Handle path parameters via the `params` option
- Use the expected dtos from '$lib/server/shared/schemas' 

## Checklist for new endpoints

1. Ensure the service method has a REST docblock (path + verb).
2. Define/compose DTO schemas in `schemas.ts` using primitives.
3. Create route file mirroring the REST path.
4. Validate params/query/body with `parse*` helpers.
5. Call service via `event.locals.authServices!` and return.
6. Use 204 for void writes; validate reads.
7. Rely on `handleServiceError()` for consistent errors.
8. **ALWAYS add or update the corresponding method in `src/client/api-client.ts`**.

## References

- Zod 4 API: `https://zod.dev/api`
- Service layer guide: `$lib/server/services/AGENTS.md`
