const mongoose = require('mongoose');

const songSchema = new mongoose.Schema({
    title: { type: String, required: true },
    artist: { type: String, required: true },
    image: { type: String, required: true },
    filename: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    
    // 🔒 NEW: The Secret Flag
    isPrivate: { type: Boolean, default: false } ,
   isFeatured: { type: Boolean, default: false }
});

module.exports = mongoose.model('Song', songSchema);
