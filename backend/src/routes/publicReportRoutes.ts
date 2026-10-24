import { Router } from 'express';
import multer from 'multer';
import { protect } from '../middleware/authMiddleware';
import { createPublicReport, listPublicReports } from '../controllers/publicReportController';
import { uploadPublicReportPhoto } from '../middleware/uploadMiddleware';
import { isMongoConnected } from '../config/db';

const router = Router();
router.post('/', (req, res, next) => {
  if (!isMongoConnected) return res.status(503).json({ success: false, message: 'Report intake is unavailable because the database is not connected. Your information was not saved.' });
  return uploadPublicReportPhoto.single('photo')(req, res, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError) {
      const message = error.code === 'LIMIT_FILE_SIZE' ? 'Photo must be 8 MB or smaller.' : 'The photo upload could not be processed.';
      return res.status(400).json({ success: false, message });
    }
    return res.status(400).json({ success: false, message: error.message || 'Choose a JPEG, PNG, or WebP photo.' });
  });
}, createPublicReport);
router.get('/', protect, listPublicReports);
export default router;
