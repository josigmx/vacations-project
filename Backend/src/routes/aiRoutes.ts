import { Router } from 'express';

import { recommendTrip, askData } from '../controllers/aiController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Every logged-in user (user or admin)
router.post('/recommendation', authMiddleware, recommendTrip);

router.post('/ask', authMiddleware, askData);

export default router;
