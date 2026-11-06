import { Router } from 'express';
import { getMatches, getMatchById, reviewMatch } from '../controllers/matchController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = Router();
router.use(protect);
router.get('/', getMatches);
router.get('/:id', getMatchById);
router.put('/:id/review', restrictTo('Admin', 'Investigator'), reviewMatch);
export default router;

