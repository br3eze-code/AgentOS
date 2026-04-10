import { Request, Response, NextFunction } from 'express';
import { logger } from '@agentclaw/kernel';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorMiddleware = (err: AppError, req: Request, res: Response, _next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  
  logger.error(`API Error [${req.method} ${req.path}]: ${err.message}`, {
    stack: err.stack,
    body: req.body,
    params: req.params,
    query: req.query
  });

  return res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error',
    code: err.code || 'INTERNAL_ERROR'
  });
};

export const notFoundMiddleware = (req: Request, res: Response) => {
  return res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
    code: 'NOT_FOUND'
  });
};
