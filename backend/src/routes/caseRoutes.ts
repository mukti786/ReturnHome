import { Router } from 'express';
import { getCases, getCaseById, createCase, updateCase } from '../controllers/caseController';
import { protect } from '../middleware/authMiddleware';

const router = Router();
router.use(protect);
router.get('/', getCases);
router.get('/:id', getCaseById);
router.post('/', createCase);
router.put('/:id', updateCase);
export default router;

