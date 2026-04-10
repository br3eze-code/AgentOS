import { Request, Response, NextFunction } from 'express';
export interface AppError extends Error {
    statusCode?: number;
    code?: string;
}
export declare const errorMiddleware: (err: AppError, req: Request, res: Response, _next: NextFunction) => Response<any, Record<string, any>>;
export declare const notFoundMiddleware: (req: Request, res: Response) => Response<any, Record<string, any>>;
//# sourceMappingURL=error.d.ts.map