const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const ctrl = require('../controllers/report.controller');

router.use(authenticate);
router.use(authorize('FINANCE_OFFICER', 'ADMIN'));

router.get('/overview', ctrl.getOverview);
router.get('/annual', ctrl.getAnnualReport);
router.get('/vertical/:name', ctrl.getVerticalReport);

module.exports = router;
