import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import fs from 'fs';

import userRoutes from './routes/userRoutes';
import vacationRoutes from './routes/vacationRoutes';
import reportRoutes from './routes/reportRoutes';
import aiRoutes from './routes/aiRoutes';
import mcpRoutes from './routes/mcpRoutes';
import { IMAGES_FOLDER } from './utils/imageFiles';
import { isDatabaseEmpty, seedDatabase } from './seedData';

dotenv.config();

const app = express();

app.use(cors());            // the React app runs on another port
app.use(express.json());    // parses the JSON request body

// The vacation images: GET /images/paris.jpg returns Backend/images/paris.jpg
fs.mkdirSync(IMAGES_FOLDER, { recursive: true });
app.use('/images', express.static(IMAGES_FOLDER));

app.use('/users', userRoutes);
app.use('/vacations', vacationRoutes);
app.use('/reports', reportRoutes);
app.use('/ai', aiRoutes);
app.use('/mcp', mcpRoutes);     // the MCP server over HTTP

const PORT = Number(process.env.PORT) || 3001;

async function startServer() {
    try {
        const mongoUri = process.env.MONGODB_URI;

        if (!mongoUri) {
            throw new Error('MONGODB_URI is missing');
        }
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is missing');
        }
        if (!process.env.GEMINI_API_KEY) {
            console.warn('GEMINI_API_KEY is missing — the AI and MCP pages will not work');
        }

        await mongoose.connect(mongoUri);

        console.log('MongoDB connected');

        // Docker: the first start fills a brand-new database, so `docker compose up` gives a working system.
        // Only when there are no users AND no vacations — existing data is never touched.
        if (process.env.SEED_IF_EMPTY === 'true' && await isDatabaseEmpty()) {
            console.log('Empty database — adding the starting data');
            await seedDatabase();
        }

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

    } catch (error) {
        console.error('Server startup error:', error);
        process.exit(1);
    }
}

startServer();
