import { Router } from 'express';
import { uploadVideo, getVideoJobs, getVideoJobById } from '../controllers/videoController';
import { protect, restrictTo } from '../middleware/authMiddleware';
import { uploadVideoFile } from '../middleware/uploadMiddleware';

const router = Router();
router.use(protect);

// Upload a video for processing
router.post('/upload', uploadVideoFile.single('video'), uploadVideo);

// Get all processing jobs (admin/investigator sees all, citizen sees own)
router.get('/', getVideoJobs);
router.get('/:id', getVideoJobById);

export default router;
