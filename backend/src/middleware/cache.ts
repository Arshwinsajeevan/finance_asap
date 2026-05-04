import { Request, Response, NextFunction } from 'express';
import cache from '../utils/cache';

/**
 * Middleware: Cache GET requests in Redis
 * @param duration - Cache duration in seconds (default: 300 / 5 mins)
 */
export const cacheMiddleware = (duration: number = 300) => {
  return async (req: Request | any, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate unique cache key based on URL and user role
    const key = `cache:${req.user?.role || 'public'}:${req.originalUrl || req.url}`;

    try {
      const cachedData = await cache.get(key);
      if (cachedData) {
        return res.json(cachedData);
      }

      // Override res.json to capture the data before sending
      const originalJson = res.json.bind(res);
      res.json = (body: any) => {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cache.set(key, body, duration);
        }
        return originalJson(body);
      };

      next();
    } catch (err) {
      console.error('Cache Middleware Error:', err);
      next();
    }
  };
};
