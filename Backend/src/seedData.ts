// The starting data of the system: users, 14 real vacations and likes.
// Used by `npm run seed` (seed.ts) and by the server's first start in Docker (app.ts, SEED_IF_EMPTY).
// seedDatabase() DELETES the existing users, vacations and likes first.
// The photos are copied from seed-images/ into images/ — so a deleted vacation's photo comes back.
//
// Test accounts:
//   admin:  admin@vacations.com / admin1234
//   users:  dana@test.com, avi@test.com, noa@test.com, omer@test.com, maya@test.com, yoni@test.com / 1234
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { UserModel } from './models/UserModel';
import { VacationModel } from './models/VacationModel';
import { LikeModel } from './models/LikeModel';
import { daysFromToday } from './utils/dateUtils';
import { IMAGES_FOLDER, SEED_IMAGES_FOLDER } from './utils/imageFiles';

// start / end = days from today, so there are always ended, active and upcoming vacations.
// likedBy = which of the 6 users (by their place in the users list) liked it.
const vacations = [
    // already ended
    { destination: 'Rome, Italy', description: 'Walk through 2,000 years of history: the Colosseum, the Roman Forum, the Vatican Museums and authentic trattorias in Trastevere.', start: -40, end: -33, price: 1650, image: 'rome.jpg', likedBy: [0, 1, 2, 3] },
    { destination: 'Barcelona, Spain', description: "Gaudí's Sagrada Família and Park Güell, the Gothic Quarter, tapas bars and the Mediterranean beaches of Barceloneta.", start: -25, end: -18, price: 1420, image: 'barcelona.jpg', likedBy: [1, 4] },
    { destination: 'Prague, Czech Republic', description: 'A fairy-tale old town: Prague Castle, Charles Bridge, the Astronomical Clock and cozy Czech beer halls.', start: -12, end: -7, price: 990, image: 'prague.jpg', likedBy: [] },
    // active right now
    { destination: 'Bangkok, Thailand', description: 'The golden temples of Wat Pho and Wat Arun, floating markets, street food and rooftop bars over the Chao Phraya river.', start: -3, end: 5, price: 1290, image: 'bangkok.jpg', likedBy: [2, 3, 5] },
    { destination: 'Dubai, United Arab Emirates', description: 'The Burj Khalifa, desert safaris, the Dubai Mall and the beaches of Jumeirah.', start: -2, end: 4, price: 2350, image: 'dubai.jpg', likedBy: [0, 4] },
    { destination: 'Paris, France', description: 'The City of Light: the Eiffel Tower, the Louvre, Montmartre and long evenings in cafés along the Seine.', start: -1, end: 6, price: 1890, image: 'paris.jpg', likedBy: [0, 1, 2, 3, 4, 5] },
    // not started yet
    { destination: 'Amsterdam, Netherlands', description: "Canal cruises, the Van Gogh Museum, the Anne Frank House and cycling through one of Europe's most charming cities.", start: 10, end: 15, price: 1380, image: 'amsterdam.jpg', likedBy: [3] },
    { destination: 'Tokyo, Japan', description: 'Neon-lit Shibuya and Shinjuku, ancient temples in Asakusa, fresh sushi and a day trip to Mount Fuji.', start: 20, end: 30, price: 3450, image: 'tokyo.jpg', likedBy: [0, 1, 2, 4, 5] },
    { destination: 'Santorini, Greece', description: 'White villages above the caldera, the famous sunsets of Oia, volcanic beaches and fresh Greek seafood.', start: 35, end: 42, price: 2150, image: 'santorini.jpg', likedBy: [1, 2, 3, 4] },
    { destination: 'Reykjavik, Iceland', description: 'Northern lights, the Golden Circle, geysers, giant waterfalls and the Blue Lagoon.', start: 45, end: 51, price: 3100, image: 'reykjavik.jpg', likedBy: [5] },
    { destination: 'London, United Kingdom', description: 'Big Ben, the British Museum, West End shows and the markets of Camden and Borough.', start: 55, end: 60, price: 1750, image: 'london.jpg', likedBy: [0, 3] },
    { destination: 'New York, USA', description: 'Times Square, Central Park, the Statue of Liberty and Broadway — the city that never sleeps.', start: 70, end: 77, price: 2890, image: 'new-york.jpg', likedBy: [0, 1, 4] },
    { destination: 'Bali, Indonesia', description: 'The rice terraces of Ubud, the surf beaches of Uluwatu, sacred water temples and tropical villas.', start: 90, end: 100, price: 1980, image: 'bali.jpg', likedBy: [2, 5] },
    { destination: 'Cape Town, South Africa', description: 'Table Mountain, the Cape of Good Hope, the penguins of Boulders Beach and the Winelands.', start: 120, end: 130, price: 2480, image: 'cape-town.jpg', likedBy: [] }
];

const users = [
    { firstName: 'Dana', lastName: 'Cohen', email: 'dana@test.com' },
    { firstName: 'Avi', lastName: 'Levi', email: 'avi@test.com' },
    { firstName: 'Noa', lastName: 'Mizrahi', email: 'noa@test.com' },
    { firstName: 'Omer', lastName: 'Peretz', email: 'omer@test.com' },
    { firstName: 'Maya', lastName: 'Friedman', email: 'maya@test.com' },
    { firstName: 'Yoni', lastName: 'Katz', email: 'yoni@test.com' }
];

// Runs on an open mongoose connection
export async function seedDatabase(): Promise<void> {
    await LikeModel.deleteMany({});
    await VacationModel.deleteMany({});
    await UserModel.deleteMany({});

    // make sure the unique index (one like per user per vacation) exists before inserting
    await LikeModel.syncIndexes();

    const userPassword = await bcrypt.hash('1234', 10);

    await UserModel.create({ firstName: 'Admin', lastName: 'Manager', email: 'admin@vacations.com', password: await bcrypt.hash('admin1234', 10), role: 'admin' });
    const createdUsers = await UserModel.create(users.map((u) => ({ ...u, password: userPassword, role: 'user' as const })));

    const createdVacations = await VacationModel.create(vacations.map((v) => ({
        destination: v.destination,
        description: v.description,
        startDate: daysFromToday(v.start),
        endDate: daysFromToday(v.end),
        price: v.price,
        imageFileName: v.image
    })));

    // the photos of the seed vacations
    fs.mkdirSync(IMAGES_FOLDER, { recursive: true });
    for (const v of vacations) {
        fs.copyFileSync(path.join(SEED_IMAGES_FOLDER, v.image), path.join(IMAGES_FOLDER, v.image));
    }

    const likes = vacations.flatMap((v, i) =>
        v.likedBy.map((userIndex) => ({ userId: createdUsers[userIndex]._id, vacationId: createdVacations[i]._id }))
    );
    await LikeModel.create(likes);

    console.log(`Seed completed: ${createdUsers.length + 1} users, ${createdVacations.length} vacations, ${likes.length} likes`);
}

// The database has no users and no vacations at all = a brand-new database
export async function isDatabaseEmpty(): Promise<boolean> {
    const [users, vacations] = await Promise.all([UserModel.countDocuments(), VacationModel.countDocuments()]);
    return users === 0 && vacations === 0;
}
