import { Router } from 'express';

import {
    getVacations, likeVacation, unlikeVacation,
    getVacationById, addVacation, updateVacation, deleteVacation
} from '../controllers/vacationController';
import { authMiddleware } from '../middleware/authMiddleware';
import { adminMiddleware } from '../middleware/adminMiddleware';
import { userOnlyMiddleware } from '../middleware/userOnlyMiddleware';
import { uploadImage } from '../middleware/uploadImage';

const router = Router();

// Every logged-in user
router.get('/', authMiddleware, getVacations);

// Users only (the admin cannot like)
router.post('/:id/like', authMiddleware, userOnlyMiddleware, likeVacation);
router.delete('/:id/like', authMiddleware, userOnlyMiddleware, unlikeVacation);

// Admin only — uploadImage reads the multipart form (the fields + the image file)
router.get('/:id', authMiddleware, adminMiddleware, getVacationById);
router.post('/', authMiddleware, adminMiddleware, uploadImage, addVacation);
router.put('/:id', authMiddleware, adminMiddleware, uploadImage, updateVacation);
router.delete('/:id', authMiddleware, adminMiddleware, deleteVacation);

export default router;
