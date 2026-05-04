import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import authorize from '../middleware/authorize';
import * as ctrl from '../controllers/report.controller';
import { cacheMiddleware } from '../middleware/cache';

const router = Router();

router.use(authenticate);
router.use(authorize('FINANCE_OFFICER', 'ADMIN'));

// Cache reports for 5 minutes
router.get('/overview', cacheMiddleware(300), ctrl.getOverview);
router.get('/annual', cacheMiddleware(300), ctrl.getAnnualReport);
router.get('/vertical/:name', cacheMiddleware(300), ctrl.getVerticalReport);

export default router;
