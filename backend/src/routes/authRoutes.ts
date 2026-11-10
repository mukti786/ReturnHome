import { Router } from 'express';
import {
  login, register, registerCitizen, googleAuth, getMe, logout,
  requestPasswordReset, devLogin, listUsers, approveUser, rejectUser,
  deactivateUser, updateProfile, changePassword
} from '../controllers/authController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = Router();

// Public routes
router.post('/register', register); // Investigator access request (requires admin approval)
router.post('/register-citizen', registerCitizen); // Citizen self-registration
router.post('/google', googleAuth); // Google OAuth registration & login
router.post('/login', login);
router.post('/dev-login', devLogin);
router.post('/password-reset', requestPasswordReset);

// Protected routes
router.get('/me', protect, getMe);
router.post('/logout', logout);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, changePassword);

// Admin-only user management
router.get('/users', protect, restrictTo('Admin'), listUsers);
router.put('/users/:id/approve', protect, restrictTo('Admin'), approveUser);
router.put('/users/:id/reject', protect, restrictTo('Admin'), rejectUser);
router.put('/users/:id/deactivate', protect, restrictTo('Admin'), deactivateUser);

export default router;
