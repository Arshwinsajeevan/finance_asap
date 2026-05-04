import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import authorize from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { 
  submitUtilisationSchema, 
  verifyUtilisationSchema 
} from '../schemas/utilisation.schema';
import { withCacheBust } from '../middleware/cacheBust';
import * as ctrl from '../controllers/utilisation.controller';

const router = Router();

router.use(authenticate);

router.post('/', authorize('VERTICAL_USER', 'FINANCE_OFFICER'), validate(submitUtilisationSchema), withCacheBust(ctrl.submitUtilisation));
router.get('/summary', authorize('VERTICAL_USER', 'FINANCE_OFFICER', 'ADMIN'), ctrl.getUtilisationSummary);
router.get('/', authorize('VERTICAL_USER', 'FINANCE_OFFICER', 'ADMIN'), ctrl.getUtilisations);

router.patch('/:id/verify', authorize('FINANCE_OFFICER'), validate(verifyUtilisationSchema), withCacheBust(ctrl.verifyUtilisation));

export default router;
