const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const { createDonorFundSchema } = require('../schemas/donor.schema');
const ctrl = require('../controllers/donor.controller');

router.use(authenticate);

router.post('/', authorize('FINANCE_OFFICER', 'VERTICAL_USER'), validate(createDonorFundSchema), ctrl.createDonorFund);
router.get('/summary', authorize('FINANCE_OFFICER', 'ADMIN'), ctrl.getDonorSummary);
router.get('/', authorize('FINANCE_OFFICER', 'ADMIN'), ctrl.getDonorFunds);

module.exports = router;
