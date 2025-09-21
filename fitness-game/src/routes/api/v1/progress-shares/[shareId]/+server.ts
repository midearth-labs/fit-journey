import type { RequestHandler } from './$types';
import { DeleteShareOperationSchema } from '$lib/server/shared/schemas';
import { parseParams, handleServiceError, noContent } from '$lib/server/shared/http';

export const DELETE: RequestHandler = async (event) => {
    try {
      const { shareId } = parseParams(event, DeleteShareOperationSchema.request.params);
      const { progressSharesService } = event.locals.authServices!;
      const dto = { shareId };
      await progressSharesService().deleteShare(dto);
      return noContent();
    } catch (err) {
      return handleServiceError(err, event.locals.requestId);
    }
  };
  