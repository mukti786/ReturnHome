import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import {
  getEvidence,
  getEvidenceById,
  exportEvidenceDossier
} from '../controllers/evidenceController';

const router = Router();

router.get('/', protect, getEvidence);
router.get('/:id', protect, getEvidenceById);
router.post('/:id/export', protect, exportEvidenceDossier);

export default router;
