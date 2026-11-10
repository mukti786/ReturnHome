import { Router } from 'express';
import {
  getCases, getCaseById, createCase, updateCase,
  uploadCasePhotoHandler, getMyCases, getCaseEmbedding, getAllEmbeddings,
  checkDuplicateCase
} from '../controllers/caseController';
import { protect, restrictTo } from '../middleware/authMiddleware';
import { uploadCasePhoto } from '../middleware/uploadMiddleware';

const router = Router();
router.use(protect);

// All authenticated users can read cases
router.get('/', getCases);
router.get('/my', getMyCases);
router.get('/embeddings', restrictTo('Admin', 'Investigator', 'Analyst'), getAllEmbeddings);
router.post('/check-duplicate', checkDuplicateCase);
router.get('/:id', getCaseById);
router.get('/:id/embedding', restrictTo('Admin', 'Investigator', 'Analyst'), getCaseEmbedding);

// Citizens can create and edit their own cases; Investigators+ can create/edit any
router.post('/', createCase);
router.put('/:id', updateCase);

// Photo upload endpoint (multipart)
router.post('/upload-photo', restrictTo('Admin', 'Investigator', 'Citizen'), uploadCasePhoto.single('photo'), uploadCasePhotoHandler);

export default router;
