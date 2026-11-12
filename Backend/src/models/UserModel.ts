import { Schema, model } from 'mongoose';

// A user of the system. MongoDB gives every document an _id — that is the user code (primary key).
const userSchema = new Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,       // no two users with the same email
        lowercase: true,    // "Dana@Test.com" and "dana@test.com" are the same email
        trim: true
    },
    password: {
        type: String,       // always the bcrypt hash — never the real password
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'     // a new user can never make himself admin
    }
}, { timestamps: true });

export const UserModel = model('User', userSchema);
