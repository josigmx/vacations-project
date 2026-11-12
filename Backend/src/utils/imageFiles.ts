import fs from 'fs';
import path from 'path';

// Backend/images — the vacation images (the DB keeps only the file name)
export const IMAGES_FOLDER = path.join(__dirname, '..', '..', 'images');

// Backend/seed-images — the photos of the 14 seed vacations (the seed copies them into images/)
export const SEED_IMAGES_FOLDER = path.join(__dirname, '..', '..', 'seed-images');

// Deletes an image from the images folder. A file that is already gone is not an error.
export async function deleteImageFile(fileName: string): Promise<void> {
    try {
        // basename = only the file name, so a name like "../app.ts" can never leave the folder
        await fs.promises.unlink(path.join(IMAGES_FOLDER, path.basename(fileName)));
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
            console.error('Could not delete image:', fileName, error);
        }
    }
}
