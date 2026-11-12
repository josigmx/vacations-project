import { Response } from 'express';
import mongoose, { PipelineStage } from 'mongoose';
import { VacationModel } from '../models/VacationModel';
import { LikeModel } from '../models/LikeModel';
import { UserModel } from '../models/UserModel';
import AuthRequest from '../types/AuthRequest';
import { statusStage } from '../utils/vacationStatus';
import { validateVacation } from '../utils/validateVacation';
import { deleteImageFile } from '../utils/imageFiles';

const PAGE_SIZE = 9;

// The filter buttons of the vacations page → what each one keeps
const FILTERS: Record<string, PipelineStage.Match['$match']> = {
    all: {},
    liked: { isLiked: true },        // only the vacations I liked
    active: { status: 'active' },    // started and not ended yet
    upcoming: { status: 'upcoming' } // not started yet
};

// GET /vacations?filter=all|liked|active|upcoming&page=1   (logged-in users only)
export async function getVacations(req: AuthRequest, res: Response): Promise<void> {
    try {
        const filter = typeof req.query.filter === 'string' ? req.query.filter : 'all';
        const page = req.query.page === undefined ? 1 : Number(req.query.page);

        if (!(filter in FILTERS)) {
            res.status(400).json({ message: 'Invalid filter' });
            return;
        }
        if (!Number.isInteger(page) || page < 1) {
            res.status(400).json({ message: 'Invalid page number' });
            return;
        }

        const userId = new mongoose.Types.ObjectId(req.user!.userId);

        const result = await VacationModel.aggregate([
            // 1. the status of every vacation — the filters AND the card badge both use it
            statusStage(),
            // 2. bring the likes of every vacation from the likes collection
            {
                $lookup: { from: 'likes', localField: '_id', foreignField: 'vacationId', as: 'likes' }
            },
            // 3. how many likes + did the logged-in user like it
            {
                $addFields: {
                    likesCount: { $size: '$likes' },
                    isLiked: { $in: [userId, '$likes.userId'] }
                }
            },
            { $project: { likes: 0 } },
            // 4. the filter
            { $match: FILTERS[filter] },
            // 5. by start date, ascending (_id keeps the order fixed for the same date)
            { $sort: { startDate: 1, _id: 1 } },
            // 6. one page of 9 + the total count, in a single query
            {
                $facet: {
                    vacations: [{ $skip: (page - 1) * PAGE_SIZE }, { $limit: PAGE_SIZE }],
                    total: [{ $count: 'count' }]
                }
            }
        ]);

        const total: number = result[0].total[0]?.count ?? 0;

        res.status(200).json({
            vacations: result[0].vacations,
            total,
            page,
            pageSize: PAGE_SIZE,
            totalPages: Math.ceil(total / PAGE_SIZE)
        });

    } catch (error) {
        res.status(500).json({ message: 'Error getting vacations' });
    }
}

// Shared checks of like / unlike. Returns an error already sent, or the ids to use.
async function checkLikeRequest(req: AuthRequest, res: Response): Promise<{ userId: string; vacationId: string } | null> {
    const vacationId = String(req.params.id);
    const userId = req.user!.userId;

    if (!mongoose.isValidObjectId(vacationId)) {
        res.status(400).json({ message: 'Invalid vacation ID' });
        return null;
    }
    if (!(await VacationModel.exists({ _id: vacationId }))) {
        res.status(404).json({ message: 'Vacation not found' });
        return null;
    }
    // a token from before the user was deleted — the user must log in again
    if (!(await UserModel.exists({ _id: userId }))) {
        res.status(401).json({ message: 'Please log in again' });
        return null;
    }

    return { userId, vacationId };
}

// POST /vacations/:id/like   (users only)
export async function likeVacation(req: AuthRequest, res: Response): Promise<void> {
    try {
        const ids = await checkLikeRequest(req, res);
        if (!ids) return;

        try {
            // upsert = create the like only if it does not exist yet → liking twice still leaves ONE like
            await LikeModel.updateOne(ids, { $setOnInsert: ids }, { upsert: true });
        } catch (error) {
            // 11000 = two clicks at the same moment hit the unique index → the like already exists, that's fine
            if ((error as { code?: number }).code !== 11000) throw error;
        }

        const likesCount = await LikeModel.countDocuments({ vacationId: ids.vacationId });

        res.status(200).json({ vacationId: ids.vacationId, isLiked: true, likesCount });

    } catch (error) {
        res.status(500).json({ message: 'Error liking vacation' });
    }
}

// DELETE /vacations/:id/like   (users only)
export async function unlikeVacation(req: AuthRequest, res: Response): Promise<void> {
    try {
        const ids = await checkLikeRequest(req, res);
        if (!ids) return;

        await LikeModel.deleteOne(ids);

        const likesCount = await LikeModel.countDocuments({ vacationId: ids.vacationId });

        res.status(200).json({ vacationId: ids.vacationId, isLiked: false, likesCount });

    } catch (error) {
        res.status(500).json({ message: 'Error removing like' });
    }
}

// ===== Admin =====

// GET /vacations/:id   (admin only — fills the edit form)
export async function getVacationById(req: AuthRequest, res: Response): Promise<void> {
    try {
        const id = String(req.params.id);

        if (!mongoose.isValidObjectId(id)) {
            res.status(400).json({ message: 'Invalid vacation ID' });
            return;
        }

        const vacation = await VacationModel.findById(id);

        if (!vacation) {
            res.status(404).json({ message: 'Vacation not found' });
            return;
        }

        res.status(200).json(vacation);

    } catch (error) {
        res.status(500).json({ message: 'Error getting vacation' });
    }
}

// POST /vacations   (admin only, multipart form: the fields + "image")
export async function addVacation(req: AuthRequest, res: Response): Promise<void> {
    try {
        const result = validateVacation(req.body ?? {}, true);

        if ('error' in result) {
            // multer already saved the image — a rejected form must not leave it behind
            if (req.file) await deleteImageFile(req.file.filename);
            res.status(400).json({ message: result.error });
            return;
        }
        if (!req.file) {
            res.status(400).json({ message: 'Please choose an image' });
            return;
        }

        // the DB keeps only the file name (with its extension); the file itself is in the images folder
        const vacation = await VacationModel.create({ ...result.data, imageFileName: req.file.filename });

        res.status(201).json(vacation);

    } catch (error) {
        if (req.file) await deleteImageFile(req.file.filename);
        res.status(500).json({ message: 'Error adding vacation' });
    }
}

// PUT /vacations/:id   (admin only, multipart form — the image is optional)
export async function updateVacation(req: AuthRequest, res: Response): Promise<void> {
    try {
        const id = String(req.params.id);

        if (!mongoose.isValidObjectId(id)) {
            if (req.file) await deleteImageFile(req.file.filename);
            res.status(400).json({ message: 'Invalid vacation ID' });
            return;
        }

        const vacation = await VacationModel.findById(id);

        if (!vacation) {
            if (req.file) await deleteImageFile(req.file.filename);
            res.status(404).json({ message: 'Vacation not found' });
            return;
        }

        const result = validateVacation(req.body ?? {}, false);   // false = past dates are allowed

        if ('error' in result) {
            if (req.file) await deleteImageFile(req.file.filename);
            res.status(400).json({ message: result.error });
            return;
        }

        const oldImage = vacation.imageFileName;

        vacation.set(result.data);
        if (req.file) vacation.imageFileName = req.file.filename;

        await vacation.save();

        // a new image replaced the old one → the old file is not needed anymore
        if (req.file && oldImage !== req.file.filename) await deleteImageFile(oldImage);

        res.status(200).json(vacation);

    } catch (error) {
        if (req.file) await deleteImageFile(req.file.filename);
        res.status(500).json({ message: 'Error updating vacation' });
    }
}

// DELETE /vacations/:id   (admin only)
export async function deleteVacation(req: AuthRequest, res: Response): Promise<void> {
    try {
        const id = String(req.params.id);

        if (!mongoose.isValidObjectId(id)) {
            res.status(400).json({ message: 'Invalid vacation ID' });
            return;
        }

        const vacation = await VacationModel.findByIdAndDelete(id);

        if (!vacation) {
            res.status(404).json({ message: 'Vacation not found' });
            return;
        }

        // the vacation is gone → its likes and its image go with it
        await LikeModel.deleteMany({ vacationId: vacation._id });
        await deleteImageFile(vacation.imageFileName);

        res.status(200).json({ message: 'Vacation deleted' });

    } catch (error) {
        res.status(500).json({ message: 'Error deleting vacation' });
    }
}
