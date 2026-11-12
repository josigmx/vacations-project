import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/UserModel';
import { TokenPayload } from '../types/AuthRequest';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 4;

interface RegisterInput {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
}

// The user as we send it to the client — NEVER the password or its hash
function publicUser(user: { _id: unknown; firstName: string; lastName: string; email: string; role: string }) {
    return {
        _id: String(user._id),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
    };
}

// Creates the JWT the client sends on every request
function createToken(user: { _id: unknown; firstName: string; lastName: string; email: string; role: string }): string {
    const payload: TokenPayload = {
        userId: String(user._id),
        email: user.email,
        role: user.role as 'user' | 'admin',
        firstName: user.firstName,
        lastName: user.lastName
    };
    return jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '8h' });
}

// POST /users/register
export async function register(req: Request, res: Response): Promise<void> {
    try {
        const body: RegisterInput = req.body ?? {};
        const firstName = body.firstName?.trim();
        const lastName = body.lastName?.trim();
        const email = body.email?.trim().toLowerCase();
        const password = body.password;

        if (!firstName || !lastName || !email || !password) {
            res.status(400).json({ message: 'All fields are required' });
            return;
        }
        if (!EMAIL_REGEX.test(email)) {
            res.status(400).json({ message: 'Invalid email address' });
            return;
        }
        if (password.length < MIN_PASSWORD) {
            res.status(400).json({ message: `Password must be at least ${MIN_PASSWORD} characters` });
            return;
        }

        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            res.status(409).json({ message: 'This email is already registered' });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // role is NOT taken from the body — the database default ("user") is used
        const user = await UserModel.create({ firstName, lastName, email, password: hashedPassword });

        res.status(201).json({ token: createToken(user), user: publicUser(user) });

    } catch (error) {
        res.status(500).json({ message: 'Error registering user' });
    }
}

// POST /users/login
export async function login(req: Request, res: Response): Promise<void> {
    try {
        const email = (req.body?.email as string | undefined)?.trim().toLowerCase();
        const password = req.body?.password as string | undefined;

        if (!email || !password) {
            res.status(400).json({ message: 'Email and password are required' });
            return;
        }
        if (!EMAIL_REGEX.test(email)) {
            res.status(400).json({ message: 'Invalid email address' });
            return;
        }
        if (password.length < MIN_PASSWORD) {
            res.status(400).json({ message: `Password must be at least ${MIN_PASSWORD} characters` });
            return;
        }

        const user = await UserModel.findOne({ email });

        // The same message for "no such user" and "wrong password" — we don't tell which one
        if (!user || !(await bcrypt.compare(password, user.password))) {
            res.status(401).json({ message: 'Incorrect email or password' });
            return;
        }

        res.status(200).json({ token: createToken(user), user: publicUser(user) });

    } catch (error) {
        res.status(500).json({ message: 'Error logging in' });
    }
}
