import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { randomUUID } from 'crypto';
import { IMAGES_FOLDER } from '../utils/imageFiles';

// The image types we accept → the extension we save them with
const EXTENSIONS: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp'
};

const MAX_SIZE_MB = 5;

// multer saves the uploaded file straight into the images folder, under a NEW unique name
// (two admins uploading "beach.jpg" never overwrite each other)
const storage = multer.diskStorage({
    destination: IMAGES_FOLDER,
    filename: (_req, file, callback) => {
        callback(null, `${randomUUID()}${EXTENSIONS[file.mimetype]}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 },
    fileFilter: (_req, file, callback) => {
        if (file.mimetype in EXTENSIONS) {
            callback(null, true);
        } else {
            callback(new Error('INVALID_TYPE'));
        }
    }
});

// Reads ONE file from the "image" field of a multipart form (the other fields go to req.body).
// multer errors become a clear 400 instead of a 500.
export function uploadImage(req: Request, res: Response, next: NextFunction): void {
    upload.single('image')(req, res, (error: unknown) => {
        if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
            res.status(400).json({ message: `The image must be up to ${MAX_SIZE_MB} MB` });
            return;
        }
        if (error) {
            res.status(400).json({ message: 'Only JPG, PNG or WEBP images are allowed' });
            return;
        }
        next();
    });
}
