import { Response } from 'express';
import { VacationModel } from '../models/VacationModel';
import AuthRequest from '../types/AuthRequest';

interface LikesRow {
    destination: string;
    likes: number;
}

// Every vacation + its number of likes, in the same order as the vacations page (by start date)
async function getLikesPerVacation(): Promise<LikesRow[]> {
    return VacationModel.aggregate([
        { $lookup: { from: 'likes', localField: '_id', foreignField: 'vacationId', as: 'likes' } },
        { $sort: { startDate: 1, _id: 1 } },
        { $project: { _id: 0, destination: 1, likes: { $size: '$likes' } } }
    ]);
}

// GET /reports/likes   (admin only) — the data of the chart
export async function getLikesReport(req: AuthRequest, res: Response): Promise<void> {
    try {
        res.status(200).json(await getLikesPerVacation());
    } catch (error) {
        res.status(500).json({ message: 'Error getting the report' });
    }
}

// A CSV cell: a value with a comma, a quote or a new line is wrapped in quotes
// ("Rome, Italy" must stay ONE cell in Excel, not two)
function csvCell(value: string | number): string {
    const text = String(value);
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

// GET /reports/csv   (admin only) — the same data as a file Excel opens
export async function downloadLikesCsv(req: AuthRequest, res: Response): Promise<void> {
    try {
        const rows = await getLikesPerVacation();

        const lines = ['Destination,Likes', ...rows.map((row) => `${csvCell(row.destination)},${row.likes}`)];

        // ﻿ (BOM) tells Excel the file is UTF-8, so "Gaudí" or "São Paulo" show correctly
        const csv = '﻿' + lines.join('\r\n');

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="Vacation Likes.csv"');
        res.status(200).send(csv);

    } catch (error) {
        res.status(500).json({ message: 'Error creating the CSV file' });
    }
}
