import { Response, NextFunction } from 'express';
import AuthRequest from '../types/AuthRequest';

// Runs AFTER authMiddleware: likes are for regular users only — the admin cannot like.
export function userOnlyMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
    if (!req.user) {
        res.status(401).json({ message: 'Please log in' });
        return;
    }

    if (req.user.role !== 'user') {
        res.status(403).json({ message: 'Admin cannot like vacations' });
        return;
    }

    next();
}
