import { Router } from 'express';
import { login, register, getMe, logout, requestPasswordReset } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/password-reset', requestPasswordReset);
router.get('/me', protect, getMe);
router.post('/logout', logout);

export default router;


