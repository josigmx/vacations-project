// Resets the database to the starting data (users, 14 vacations, likes, photos).
// Run: npm run seed   — it DELETES the existing users, vacations and likes first.
// The data itself is in seedData.ts.
//
// Test accounts:
//   admin:  admin@vacations.com / admin1234
//   users:  dana@test.com, avi@test.com, noa@test.com, omer@test.com, maya@test.com, yoni@test.com / 1234
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { seedDatabase } from './seedData';

dotenv.config();

async function seed() {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
        throw new Error('MONGODB_URI is missing');
    }

    await mongoose.connect(mongoUri);
    await seedDatabase();
    await mongoose.connection.close();
}

seed().catch((error) => {
    console.error('Seed error:', error);
    process.exit(1);
});
