const router = require('express').Router();
const { login, register, getMe } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const { loginSchema, registerSchema } = require('../schemas/auth.schema');

router.post('/login', validate(loginSchema), login);
router.post('/register', authenticate, authorize('ADMIN', 'FINANCE_OFFICER'), validate(registerSchema), register);
router.get('/me', authenticate, getMe);

module.exports = router;
