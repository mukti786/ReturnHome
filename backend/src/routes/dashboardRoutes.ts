import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboardController';
import { protect } from '../middleware/authMiddleware';

const router = Router();
router.use(protect);
router.get('/stats', getDashboardStats);
export default router;

