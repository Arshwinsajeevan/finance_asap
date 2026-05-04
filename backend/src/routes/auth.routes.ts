import { Router } from 'express';
import { login, register, getMe } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import authorize from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { loginSchema, registerSchema } from '../schemas/auth.schema';

const router = Router();

router.post('/login', validate(loginSchema), login);
router.post('/register', authenticate, authorize('ADMIN', 'FINANCE_OFFICER'), validate(registerSchema), register);
router.get('/me', authenticate, getMe);

export default router;
