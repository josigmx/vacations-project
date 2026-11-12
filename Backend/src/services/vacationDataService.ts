import { VacationModel } from '../models/VacationModel';
import { statusStage } from '../utils/vacationStatus';

// ============================================
// Read-only questions about the vacations — the MCP tools call these.
// They never return user details (emails, passwords): only vacation data.
// ============================================

export type StatusFilter = 'all' | 'active' | 'upcoming' | 'ended';

// "2026-11-20" — a vacation date is a calendar day
function toDay(date: Date): string {
    return date.toISOString().slice(0, 10);
}

function round2(value: number): number {
    return Math.round(value * 100) / 100;
}

// How many vacations of each status + price statistics + total likes
export async function getVacationsSummary() {
    const [result] = await VacationModel.aggregate([
        statusStage(),
        { $lookup: { from: 'likes', localField: '_id', foreignField: 'vacationId', as: 'likes' } },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
                upcoming: { $sum: { $cond: [{ $eq: ['$status', 'upcoming'] }, 1, 0] } },
                ended: { $sum: { $cond: [{ $eq: ['$status', 'ended'] }, 1, 0] } },
                averagePrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' },
                totalLikes: { $sum: { $size: '$likes' } }
            }
        }
    ]);

    if (!result) {
        return { total: 0, active: 0, upcoming: 0, ended: 0, averagePrice: 0, minPrice: 0, maxPrice: 0, totalLikes: 0 };
    }

    return {
        total: result.total,
        active: result.active,
        upcoming: result.upcoming,
        ended: result.ended,
        averagePrice: round2(result.averagePrice),
        minPrice: result.minPrice,
        maxPrice: result.maxPrice,
        totalLikes: result.totalLikes,
        currency: 'USD',
        today: toDay(new Date())
    };
}

// The vacations themselves (optionally only one status), sorted by start date
export async function listVacations(status: StatusFilter) {
    const vacations = await VacationModel.aggregate([
        statusStage(),
        ...(status === 'all' ? [] : [{ $match: { status } }]),
        { $lookup: { from: 'likes', localField: '_id', foreignField: 'vacationId', as: 'likes' } },
        { $sort: { startDate: 1, _id: 1 } },
        {
            $project: {
                _id: 0, destination: 1, description: 1, startDate: 1, endDate: 1, price: 1, status: 1,
                likes: { $size: '$likes' }
            }
        }
    ]);

    return vacations.map((v) => ({ ...v, startDate: toDay(v.startDate), endDate: toDay(v.endDate) }));
}

// The most liked vacations first
export async function getMostLikedVacations(limit: number) {
    const vacations = await VacationModel.aggregate([
        statusStage(),
        { $lookup: { from: 'likes', localField: '_id', foreignField: 'vacationId', as: 'likes' } },
        { $project: { _id: 0, destination: 1, startDate: 1, price: 1, status: 1, likes: { $size: '$likes' } } },
        { $sort: { likes: -1, startDate: 1 } },
        { $limit: limit }
    ]);

    return vacations.map((v) => ({ ...v, startDate: toDay(v.startDate) }));
}
