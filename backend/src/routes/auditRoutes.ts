import { Router } from 'express';
import { getAuditLogs } from '../controllers/auditController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = Router();
router.use(protect, restrictTo('Admin', 'Investigator'));
router.get('/', getAuditLogs);
export default router;

