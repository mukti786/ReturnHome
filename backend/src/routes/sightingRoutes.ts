import { Router } from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware';
import {
  createSighting,
  getSightings,
  getSightingById,
  reviewSighting
} from '../controllers/sightingController';

const router = Router();

// Citizens and Investigators can submit sightings and list their accessible sightings
router.post('/', protect, createSighting);
router.get('/', protect, getSightings);
router.get('/:id', protect, getSightingById);

// Only Investigators, Admins, and Analysts can review/verify/reject sightings
router.put('/:id/review', protect, restrictTo('Admin', 'Investigator', 'Analyst'), reviewSighting);

export default router;
