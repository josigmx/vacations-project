import { Router } from 'express';

import { getLikesReport, downloadLikesCsv } from '../controllers/reportController';
import { authMiddleware } from '../middleware/authMiddleware';
import { adminMiddleware } from '../middleware/adminMiddleware';

const router = Router();

// Admin only: Request → authMiddleware → adminMiddleware → controller
router.get('/likes', authMiddleware, adminMiddleware, getLikesReport);

router.get('/csv', authMiddleware, adminMiddleware, downloadLikesCsv);

export default router;
