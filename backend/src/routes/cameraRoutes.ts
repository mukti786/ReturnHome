import { Router } from 'express';
import {
  getCameras, createCamera, updateCamera
} from '../controllers/detectionController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = Router();
router.use(protect);

// Camera management routes
router.get('/', getCameras);
router.post('/', restrictTo('Admin', 'Investigator'), createCamera);
router.put('/:id', restrictTo('Admin', 'Investigator'), updateCamera);

export default router;
