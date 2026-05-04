import { Request, Response, NextFunction } from 'express';
import cache from '../utils/cache';

/**
 * Middleware: Invalidate dashboard cache after any write operation.
 * Place this AFTER the controller handler on POST/PATCH/DELETE routes
 * that modify financial data (salaries, requisitions, invoices, etc.)
 */

/**
 * Express middleware — call after a successful write to bust the dashboard cache.
 */
export const bustDashboardCache = (req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    if (res.statusCode < 400) {
      cache.invalidatePattern('cache:');
    }
    return originalJson(body);
  };
  next();
};

/**
 * Higher-order wrapper: wraps any controller so cache is busted after success.
 */
export const withCacheBust = (controllerFn: Function) => {
  return async (req: Request, res: Response, ...args: any[]) => {
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      if (res.statusCode < 400) {
        cache.invalidatePattern('cache:');
      }
      return originalJson(body);
    };
    return controllerFn(req, res, ...args);
  };
};
