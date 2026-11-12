import { ApiError, GenerateContentParameters, GenerateContentResponse, GoogleGenAI } from '@google/genai';

// ============================================
// llmService — every call to Gemini goes through here.
//
// Two protections:
//   1. timeout  — Google sometimes answers "overloaded" only after ~100 seconds.
//                 We wait at most 25 seconds and turn off the SDK's own retries
//                 (by default it tries 5 times, with up to 60 seconds between tries).
//   2. fallback — if the main model is overloaded / rate-limited / too slow,
//                 the same request goes to the backup model.
// The model names come from .env, so they can change without touching the code.
// ============================================

const TIMEOUT_MS = 25000;

let client: GoogleGenAI | null = null;

// Created on first use — at import time dotenv has not loaded the key yet
function getClient(): GoogleGenAI {
    if (!client) {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY is missing');
        }
        client = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY,
            httpOptions: { timeout: TIMEOUT_MS, retryOptions: { attempts: 1 } }
        });
    }
    return client;
}

function getModels(): string[] {
    return [
        process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
        process.env.GEMINI_FALLBACK_MODEL || 'gemini-3.1-flash-lite'
    ];
}

// A temporary problem on Google's side → worth trying the backup model
export function isTemporaryAiError(error: unknown): boolean {
    if (error instanceof ApiError) {
        return error.status === 429 || error.status >= 500;
    }
    return error instanceof Error && /timeout|timed out|abort/i.test(`${error.name} ${error.message}`);
}

// generateContent with the main model, and the backup model when the main one is unavailable
export async function generate(request: Omit<GenerateContentParameters, 'model'>): Promise<GenerateContentResponse> {
    let lastError: unknown;

    for (const model of getModels()) {
        try {
            return await getClient().models.generateContent({ ...request, model });
        } catch (error) {
            lastError = error;
            if (!isTemporaryAiError(error)) break;   // a real error (bad request, bad key) → no point trying again
            const reason = error instanceof ApiError ? `HTTP ${error.status}` : 'timeout';
            console.warn(`Gemini model ${model} is unavailable (${reason}), trying the next one`);
        }
    }

    throw lastError;
}
