import { Request } from 'express';

// What we keep inside the JWT token
export interface TokenPayload {
    userId: string;
    email: string;
    role: 'user' | 'admin';
    firstName: string;
    lastName: string;
}

// A request that passed authMiddleware — it carries the logged-in user
interface AuthRequest extends Request {
    user?: TokenPayload;
}

export default AuthRequest;
