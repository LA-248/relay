import type { RequestHandler } from 'express';
import { z, ZodSafeParseResult, ZodType } from 'zod/v4';

type Target = 'body' | 'params' | 'query' | 'user';

export const validate =
  (requestSchemas: Partial<Record<Target, ZodType>>): RequestHandler =>
  (req, res, next) => {
    for (const requestProperty of Object.keys(requestSchemas) as Target[]) {
      // Retrieve the Zod schema of the associated request property
      const schema = requestSchemas[requestProperty];

      if (!schema) continue;

      const result: ZodSafeParseResult<unknown> = schema.safeParse(
        req[requestProperty],
      );

      if (!result.success) {
        console.error(
          `Error, validation failed, invalid request ${requestProperty} data:`,
          z.prettifyError(result.error),
        );
        res.status(400).json({
          error:
            requestProperty !== 'user'
              ? 'Invalid request data. Please try again.'
              : 'An unexpected error occurred',
        });
        return;
      }

      req[requestProperty] = result.data;
    }

    return next();
  };
