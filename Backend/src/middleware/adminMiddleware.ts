import { Response, NextFunction } from 'express';
import AuthRequest from '../types/AuthRequest';

// Runs AFTER authMiddleware: lets the request continue only for an admin.
// 401 = we don't know who you are · 403 = we know you, but you are not allowed
export function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
    if (!req.user) {
        res.status(401).json({ message: 'Please log in' });
        return;
    }

    if (req.user.role !== 'admin') {
        res.status(403).json({ message: 'Access denied. Admin only' });
        return;
    }

    next();
}
