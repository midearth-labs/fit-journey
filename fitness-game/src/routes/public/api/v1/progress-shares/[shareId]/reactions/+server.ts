import type { RequestHandler } from './$types';
import { AddShareReactionOperationSchema } from '$lib/server/shared/schemas';
import { parseBody, parseParams, handleServiceError, noContent } from '$lib/server/shared/http';

export const POST: RequestHandler = async (event) => {
  try {
    const { shareId } = parseParams(event, AddShareReactionOperationSchema.request.params);
    const dto = await parseBody(event, AddShareReactionOperationSchema.request.body);
    const { progressSharesUnAuthenticatedService } = event.locals.unAuthServices!;
    await progressSharesUnAuthenticatedService().addShareReaction({ ...dto, shareId });
    return noContent();
  } catch (err) {
    return handleServiceError(err, event.locals.requestId);
  }
};
