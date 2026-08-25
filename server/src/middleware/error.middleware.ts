import type { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Throw this from a service/route handler to produce a specific HTTP status
 * instead of a generic 500, e.g. `throw new HttpError(404, 'Customer not found')`.
 */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

/**
 * Wraps an async Express handler so a rejected promise reaches
 * errorMiddleware via next() instead of crashing the process. Every route
 * handler that does `await` should be wrapped in this.
 */
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>,
): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}

/**
 * Global error handler. Must be registered last, after all routes.
 */
export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- required by Express to be recognized as an error handler
  _next: NextFunction,
): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }

  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}
