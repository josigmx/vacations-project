import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import AuthRequest, { TokenPayload } from '../types/AuthRequest';

// Lets the request continue ONLY if it carries a valid token.
// Header format: Authorization: Bearer <token>
export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith('Bearer ')) {
        res.status(401).json({ message: 'Please log in' });
        return;
    }

    const token = authorization.split(' ')[1];
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        res.status(500).json({ message: 'Server configuration error' });
        return;
    }

    try {
        req.user = jwt.verify(token, secret) as TokenPayload;
        next();
    } catch {
        res.status(401).json({ message: 'Invalid or expired session, please log in again' });
    }
}
