const router = require('express').Router();
const { login, register, getMe } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const authorize = require('../middleware/authorize');

router.post('/login', login);
router.post('/register', authenticate, authorize('ADMIN', 'FINANCE_OFFICER'), register);
router.get('/me', authenticate, getMe);

module.exports = router;
