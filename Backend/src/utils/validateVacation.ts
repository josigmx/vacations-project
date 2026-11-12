import { today } from './dateUtils';

// What the add / edit form sends (multipart form = every field arrives as a string)
export interface VacationInput {
    destination?: string;
    description?: string;
    startDate?: string;      // "YYYY-MM-DD"
    endDate?: string;
    price?: string | number;
}

export interface VacationData {
    destination: string;
    description: string;
    startDate: Date;
    endDate: Date;
    price: number;
}

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
export const MAX_PRICE = 10000;

// "2026-11-20" → the day at midnight UTC, or null when it is not a real day (e.g. "2026-02-31")
function parseDay(value: string): Date | null {
    if (!DATE_REGEX.test(value)) return null;
    const date = new Date(value);
    if (isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return null;
    return date;
}

// Checks the form AND converts it to the right types (Number, Date) in one place.
// isNew = add (no past dates) · edit allows past dates — a vacation that already ended can be edited.
export function validateVacation(body: VacationInput, isNew: boolean): { error: string } | { data: VacationData } {
    const destination = body.destination?.trim();
    const description = body.description?.trim();
    const startText = body.startDate?.trim();
    const endText = body.endDate?.trim();
    const priceText = String(body.price ?? '').trim();

    if (!destination || !description || !startText || !endText || !priceText) {
        return { error: 'All fields are required' };
    }

    const price = Number(priceText);
    if (!Number.isFinite(price)) {
        return { error: 'Price must be a number' };
    }
    if (price < 0 || price > MAX_PRICE) {
        return { error: 'Price must be between 0 and 10,000' };
    }

    const startDate = parseDay(startText);
    const endDate = parseDay(endText);
    if (!startDate || !endDate) {
        return { error: 'Invalid date' };
    }
    if (endDate < startDate) {
        return { error: 'End date cannot be before start date' };
    }
    if (isNew && startDate < today()) {
        return { error: 'Dates cannot be in the past' };
    }

    return { data: { destination, description, startDate, endDate, price } };
}
