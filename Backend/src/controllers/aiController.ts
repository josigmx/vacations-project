import { Response } from 'express';
import AuthRequest from '../types/AuthRequest';
import { getTripRecommendation } from '../services/aiService';
import { askWithMcp } from '../services/mcpChatService';
import { isTemporaryAiError } from '../services/llmService';

const MAX_DESTINATION = 80;
const MAX_QUESTION = 300;

// The same error answer for both AI routes:
// Google is overloaded / too slow → 503 "try again" · anything else → 500
function sendAiError(res: Response, error: unknown, what: string): void {
    console.error(`${what} failed:`, error);

    if (isTemporaryAiError(error)) {
        res.status(503).json({ message: 'The AI service is busy right now. Please try again in a minute.' });
        return;
    }
    res.status(500).json({ message: `Failed to get ${what}` });
}

// POST /ai/recommendation   { destination }   (logged-in users)
export async function recommendTrip(req: AuthRequest, res: Response): Promise<void> {
    const destination = typeof req.body?.destination === 'string' ? req.body.destination.trim() : '';

    if (!destination) {
        res.status(400).json({ message: 'Please enter a destination' });
        return;
    }
    if (destination.length > MAX_DESTINATION) {
        res.status(400).json({ message: `The destination can be up to ${MAX_DESTINATION} characters` });
        return;
    }

    try {
        const recommendation = await getTripRecommendation(destination);

        if (!recommendation.isDestination) {
            res.status(422).json({ message: `"${destination}" does not look like a travel destination. Please try a city or a country.` });
            return;
        }

        res.status(200).json(recommendation);

    } catch (error) {
        sendAiError(res, error, 'a recommendation');
    }
}

// POST /ai/ask   { question }   (logged-in users) — answered through the MCP server
export async function askData(req: AuthRequest, res: Response): Promise<void> {
    const question = typeof req.body?.question === 'string' ? req.body.question.trim() : '';

    if (!question) {
        res.status(400).json({ message: 'Please enter a question' });
        return;
    }
    if (question.length > MAX_QUESTION) {
        res.status(400).json({ message: `The question can be up to ${MAX_QUESTION} characters` });
        return;
    }

    try {
        res.status(200).json(await askWithMcp(question));
    } catch (error) {
        sendAiError(res, error, 'an answer');
    }
}
