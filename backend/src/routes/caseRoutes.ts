import { Router } from 'express';
import { getCases, getCaseById, createCase, updateCase } from '../controllers/caseController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = Router();
router.use(protect);
router.get('/', getCases);
router.get('/:id', getCaseById);
router.post('/', restrictTo('Admin', 'Investigator'), createCase);
router.put('/:id', restrictTo('Admin', 'Investigator'), updateCase);
export default router;

