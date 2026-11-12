import { Type } from '@google/genai';
import { generate } from './llmService';

// ============================================
// aiService — a trip recommendation for a destination.
//
// We ask Gemini for STRUCTURED JSON (responseSchema), not free text:
// the page gets fixed fields (summary, attractions, food, tips, days)
// and shows them in sections — no parsing of free text, no HTML from the model.
// ============================================

export interface TripRecommendation {
    isDestination: boolean;      // false = the text is not a real place
    destination: string;         // the name, written properly ("paris" → "Paris, France")
    summary: string;
    bestTimeToVisit: string;
    topAttractions: string[];
    localFood: string[];
    tips: string[];
    itinerary: { day: number; plan: string }[];
}

const RECOMMENDATION_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        isDestination: { type: Type.BOOLEAN, description: 'false if the text is not a real travel destination' },
        destination: { type: Type.STRING, description: 'The destination name, e.g. "Paris, France"' },
        summary: { type: Type.STRING, description: '2-3 sentences: why to visit' },
        bestTimeToVisit: { type: Type.STRING },
        topAttractions: { type: Type.ARRAY, items: { type: Type.STRING }, description: '4-6 must-see places' },
        localFood: { type: Type.ARRAY, items: { type: Type.STRING }, description: '3-5 dishes or food experiences' },
        tips: { type: Type.ARRAY, items: { type: Type.STRING }, description: '3-5 practical tips' },
        itinerary: {
            type: Type.ARRAY,
            description: 'A 3-day plan',
            items: {
                type: Type.OBJECT,
                properties: {
                    day: { type: Type.INTEGER },
                    plan: { type: Type.STRING }
                },
                required: ['day', 'plan']
            }
        }
    },
    required: ['isDestination', 'destination', 'summary', 'bestTimeToVisit', 'topAttractions', 'localFood', 'tips', 'itinerary']
};

export async function getTripRecommendation(destination: string): Promise<TripRecommendation> {
    const response = await generate({
        contents: `Recommend a trip to this destination: "${destination}".`,
        config: {
            systemInstruction:
                'You are an experienced travel advisor. Write in English, practical and friendly. ' +
                'If the text is not a real travel destination (a city, region, island or country), ' +
                'set isDestination to false and leave the other fields empty.',
            responseMimeType: 'application/json',
            responseSchema: RECOMMENDATION_SCHEMA
        }
    });

    // the schema makes the model return JSON — still, a broken answer must not crash the server
    try {
        return JSON.parse(response.text ?? '') as TripRecommendation;
    } catch {
        throw new Error('The AI returned an invalid answer');
    }
}
