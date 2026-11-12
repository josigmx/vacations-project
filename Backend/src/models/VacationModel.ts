import { Schema, model } from 'mongoose';

// A vacation. _id is the vacation code (primary key).
const vacationSchema = new Schema({
    destination: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0,
        max: 10000
    },
    imageFileName: {
        type: String,       // only the file name (e.g. "paris.jpg") — the image itself is in the server's images folder
        required: true
    }
}, { timestamps: true });

export const VacationModel = model('Vacation', vacationSchema);
