import type { NextFunction, Request, Response } from 'express';

export function errorHandler(
  err: Error & { statusCode?: number },
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const statusCode = err.statusCode ?? 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: message,
  });
}
