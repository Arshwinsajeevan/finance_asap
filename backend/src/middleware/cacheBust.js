const cache = require('../utils/cache');

/**
 * Middleware: Invalidate dashboard cache after any write operation.
 * Place this AFTER the controller handler on POST/PATCH/DELETE routes
 * that modify financial data (salaries, requisitions, invoices, etc.)
 * 
 * Usage in routes:
 *   router.post('/', validate(schema), ctrl.create, bustCache);
 * 
 * OR wrap a controller directly:
 *   const handler = withCacheBust(ctrl.create);
 */

/**
 * Express middleware — call after a successful write to bust the dashboard cache.
 * Works as a response interceptor: if status < 400, bust cache.
 */
const bustDashboardCache = (req, res, next) => {
  // Hook into response finish event
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    // Only invalidate on successful writes
    if (res.statusCode < 400) {
      cache.invalidatePattern('overview');
    }
    return originalJson(body);
  };
  next();
};

/**
 * Higher-order wrapper: wraps any controller so cache is busted after success.
 * Usage: router.post('/', validate(schema), withCacheBust(ctrl.createSalary));
 */
const withCacheBust = (controllerFn) => {
  return async (req, res, ...args) => {
    // Hook into res.json to bust cache on success
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode < 400) {
        cache.invalidatePattern('overview');
      }
      return originalJson(body);
    };
    return controllerFn(req, res, ...args);
  };
};

module.exports = { bustDashboardCache, withCacheBust };
