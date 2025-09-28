# API Layer Implementation Guide (/api/v1)

This guide documents patterns for implementing SvelteKit API routes under `/api/v1`, wired to services in `$lib/server/services` and using Zod 4 for validation (`https://zod.dev/api`).

## Overview

- Routes under `public/api/v1` are not user-facing. You can safely use `event.locals.unAuthServices!`.
- Each endpoint mirrors the REST path documented in the corresponding service method.
- Validate all inputs and outputs with Zod. Centralize schemas and helpers.

## File layout

Mirror REST paths with SvelteKit routing:
- `POST /progress-shares/:shareId/reactions` → `users/me/profile/+server.ts`
- `PUT /logs/:logDate` → `logs/[logDate]/+server.ts`
- `GET /logs?from&to&userChallengeId` → `logs/+server.ts`
- `POST /user-challenges` → `user-challenges/+server.ts`
- `GET /user-challenges` → `user-challenges/+server.ts`
- `GET /user-challenges/:userChallengeId` → `user-challenges/[userChallengeId]/+server.ts`
- `DELETE /user-challenges/:userChallengeId` → `user-challenges/[userChallengeId]/+server.ts`
- `PATCH /user-challenges/:userChallengeId/schedule` → `user-challenges/[userChallengeId]/schedule/+server.ts`
- `POST /user-challenges/:userChallengeId/assessmentzes/:knowledgeBaseId` → `user-challenges/[userChallengeId]/assessmentzes/[knowledgeBaseId]/+server.ts`
- `GET /user-challenges/:userChallengeId/assessmentzes` → `user-challenges/[userChallengeId]/assessmentzes/+server.ts`
- `GET /content/challenges/:challengeId` → `content/challenges/[challengeId]/+server.ts`
- `GET /content/challenges` → `content/challenges/+server.ts`

## Shared building blocks

- `$lib/server/shared/z.primitives.ts` – common Zod primitives (uuid, email, iso date, enums, etc.) using latest Zod APIs:
  - `z.uuid()`, `z.email()`, `z.iso.date()`
- `$lib/server/shared/schemas.ts` – **Consolidated operation schemas** and DTO-aligned schemas composed from primitives; reuse via `.extend()/.omit()/.pick()`.
- `$lib/server/shared/http.ts` – helpers:
  - `parseBody(event, schema)` – JSON + Zod
  - `parseQuery(event, schema)` – URLSearchParams + Zod
  - `parseParams(event, schema)` – route params + Zod
  - `validateAndReturn(data, schema)` – response validation
  - `noContent()` – 204
  - `handleServiceError(err)` – maps `ValidationError` → 400, others → 500

## Consolidated Operation Schemas

**NEW APPROACH**: All API operations now use consolidated schemas that define the complete request/response structure in one place.

### Schema Structure

Each operation follows this pattern in `schemas.ts`:

```typescript
export const {OperationName}OperationSchema = {
  request: {
    params: ParamSchema{IfExists},
    query: QuerySchema{IfExists},
    body: BodySchema{IfExists},
  },
  response: {
    body: ResponseSchema{IfExists},
  }
};

export type {OperationName}Operation = {
  request: {
    params: z.infer<typeof {OperationName}OperationSchema.request.params>;
    query: z.infer<typeof {OperationName}OperationSchema.request.query>;
    body: z.infer<typeof {OperationName}OperationSchema.request.body>;
  };
  response: {
    body: z.infer<typeof {OperationName}OperationSchema.response.body>;
  };
};
```

### Benefits

1. **Centralized Schema Management**: All operation schemas in one place
2. **Type Safety**: Full TypeScript inference from consolidated schemas
3. **Consistency**: Uniform structure across all operations
4. **Maintainability**: Easier to update schemas and ensure consistency
5. **Documentation**: Clear request/response structure for each operation

## Handler pattern

- Thin handlers: validate → call service → return.
- Use the service factory per-request: `const { service } = event.locals.unAuthServices!; service().method(dto)`.
- Writes without body return 204; reads return 200 with validated JSON.

### Example: PATCH /users/me/profile
```ts
import type { RequestHandler } from './$types';
import { UpdateUserProfileOperationSchema } from '$lib/server/shared/schemas';
import { parseBody, handleServiceError, noContent } from '$lib/server/shared/http';

export const PATCH: RequestHandler = async (event) => {
  try {
    const dto = await parseBody(event, UpdateUserProfileOperationSchema.request.body);
    const { userProfileService } = event.locals.unAuthServices!;
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
import { PutUserLogOperationSchema } from '$lib/server/shared/schemas';
import { parseBody, parseParams, handleServiceError, noContent } from '$lib/server/shared/http';

export const PUT: RequestHandler = async (event) => {
  try {
    const { logDate } = parseParams(event, PutUserLogOperationSchema.request.params);
    const { values } = await parseBody(event, PutUserLogOperationSchema.request.body);
    const { logService } = event.locals.unAuthServices!;
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
import { ListUserLogsOperationSchema } from '$lib/server/shared/schemas';
import { parseQuery, handleServiceError, validateAndReturn } from '$lib/server/shared/http';

export const GET: RequestHandler = async (event) => {
  try {
    const dto = parseQuery(event, ListUserLogsOperationSchema.request.query);
    const { logService } = event.locals.unAuthServices!;
    const logs = await logService().listUserLogs(dto);
    return validateAndReturn(logs, ListUserLogsOperationSchema.response.body);
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};
```

### Example: DELETE /user-challenges/:userChallengeId
```ts
import type { RequestHandler } from './$types';
import { CancelUserChallengeOperationSchema } from '$lib/server/shared/schemas';
import { parseParams, handleServiceError, noContent } from '$lib/server/shared/http';

export const DELETE: RequestHandler = async (event) => {
  try {
    const { userChallengeId } = parseParams(event, CancelUserChallengeOperationSchema.request.params);
    const { challengeService } = event.locals.unAuthServices!;
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

When creating a new endpoint, add the corresponding method to `ApiClient` class using **consolidated operation types**:

```typescript
// For GET endpoints
/** GET /endpoint/:param */
async getEndpoint(param: string): Promise<GetEndpointOperation['response']['body']> {
  return this.request<GetEndpointOperation['response']['body']>('/endpoint/:param', { method: 'GET' }, {
    params: { param }
  });
}

// For POST endpoints
/** POST /endpoint */
async createEndpoint(dto: CreateEndpointOperation['request']['body']): Promise<CreateEndpointOperation['response']['body']> {
  return this.request<CreateEndpointOperation['response']['body']>('/endpoint', { 
    method: 'POST', 
    body: JSON.stringify(dto) 
  });
}

// For PATCH endpoints with params
/** PATCH /endpoint/:param */
async updateEndpoint(dto: UpdateEndpointOperation['request']): Promise<UpdateEndpointOperation['response']['body']> {
  await this.request<UpdateEndpointOperation['response']['body']>('/endpoint/:param', { 
    method: 'PATCH', 
    body: JSON.stringify(dto.body) 
  }, {
    params: { param: dto.params.param }
  });
}

// For DELETE endpoints
/** DELETE /endpoint/:param */
async deleteEndpoint(param: string): Promise<DeleteEndpointOperation['response']['body']> {
  await this.request<DeleteEndpointOperation['response']['body']>('/endpoint/:param', { method: 'DELETE' }, {
    params: { param }
  });
}
```

### API Client Method Conventions

- **Use consolidated operation types** from `$lib/server/shared/schemas`
- Use descriptive method names that match the HTTP verb and resource
- Include JSDoc comments with the HTTP method and path
- Use proper parameter substitution for path parameters
- Return appropriate types using `OperationType['response']['body']`
- Handle query parameters via the `query` option
- Handle path parameters via the `params` option
- **Import operation types** from `$lib/server/shared/schemas` 

## Checklist for new endpoints

1. Ensure the service method has a REST docblock (path + verb).
2. **Define consolidated operation schema** in `schemas.ts` using the `{OperationName}OperationSchema` pattern.
3. **Export the operation type** using the `{OperationName}Operation` pattern.
4. Create route file mirroring the REST path.
5. **Import the consolidated operation schema** and use `OperationSchema.request.params/query/body`.
6. **Use `OperationSchema.response.body`** for response validation.
7. Call service via `event.locals.unAuthServices!` and return.
8. Use 204 for void writes; validate reads.
9. Rely on `handleServiceError()` for consistent errors.
10. **ALWAYS add or update the corresponding method in `src/client/api-client.ts`** using operation types.

## References

- Zod 4 API: `https://zod.dev/api`
- Service layer guide: `$lib/server/services/AGENTS.md`
