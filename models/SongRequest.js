const mongoose = require('mongoose');

const songRequestSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['song', 'artist'],
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    requestedBy: {
        type: String,  // username string — no need for ObjectId ref
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'added', 'rejected'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('SongRequest', songRequestSchema);
