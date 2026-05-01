const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const { 
  submitUtilisationSchema, 
  verifyUtilisationSchema 
} = require('../schemas/utilisation.schema');
const { withCacheBust } = require('../middleware/cacheBust');
const ctrl = require('../controllers/utilisation.controller');

router.use(authenticate);

router.post('/', authorize('VERTICAL_USER', 'FINANCE_OFFICER'), validate(submitUtilisationSchema), withCacheBust(ctrl.submitUtilisation));
router.get('/summary', authorize('VERTICAL_USER', 'FINANCE_OFFICER', 'ADMIN'), ctrl.getUtilisationSummary);
router.get('/', authorize('VERTICAL_USER', 'FINANCE_OFFICER', 'ADMIN'), ctrl.getUtilisations);

router.patch('/:id/verify', authorize('FINANCE_OFFICER'), validate(verifyUtilisationSchema), withCacheBust(ctrl.verifyUtilisation));

module.exports = router;
