import { Schema, model } from 'mongoose';

// A like = which user liked which vacation.
// Users and vacations are many-to-many, so the likes live in their own collection with a ref to each side.
const likeSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    vacationId: {
        type: Schema.Types.ObjectId,
        ref: 'Vacation',
        required: true
    }
}, { timestamps: true });

// A user can like the same vacation only once — the database itself refuses a second one
likeSchema.index({ userId: 1, vacationId: 1 }, { unique: true });

export const LikeModel = model('Like', likeSchema);
