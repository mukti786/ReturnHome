import { Router } from 'express';
import { login, register, getMe, logout, requestPasswordReset, devLogin } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/dev-login', devLogin);
router.post('/password-reset', requestPasswordReset);
router.get('/me', protect, getMe);
router.post('/logout', logout);

export default router;


