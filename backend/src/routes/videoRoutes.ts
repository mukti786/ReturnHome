import { Router } from 'express';
import { analyzeVideo } from '../controllers/videoController';
import { protect } from '../middleware/authMiddleware';

const router = Router();
router.use(protect);
router.post('/analyze', analyzeVideo);
export default router;

