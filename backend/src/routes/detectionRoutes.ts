import { Router } from 'express';
import {
  processLiveFrame, listDetections, reviewDetection
} from '../controllers/detectionController';
import { protect, restrictTo } from '../middleware/authMiddleware';
import { uploadLiveFrame } from '../middleware/uploadMiddleware';

const router = Router();
router.use(protect);

// Live frame processing (for webcam & camera stream ingestion)
router.post('/live-frame', uploadLiveFrame.single('frame'), processLiveFrame);

// List detection events (Investigator/Admin/Analyst)
router.get('/', listDetections);

// Review candidate detection (Investigator/Admin)
router.put('/:id/review', restrictTo('Admin', 'Investigator'), reviewDetection);

export default router;
