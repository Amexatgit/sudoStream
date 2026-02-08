require('dotenv').config();
const express = require('express'); // NEW: The Framework
const mongoose = require('mongoose');
const multer = require('multer'); // NEW: File Uploader
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8000;

// 1. Middleware (Security & parsing)
app.use(cors());
app.use(express.json());
app.use('/public', express.static('public'));

// 2. Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected (Express Mode)'))
    .catch(err => console.error('❌ DB Error:', err));

// 3. Schema
const SongSchema = new mongoose.Schema({
    title: String,
    artist: String,
    filename: String,
    image: String,
    addedAt: { type: Date, default: Date.now }
});
const Song = mongoose.model('Song', SongSchema);

// 4. STORAGE ENGINE (For Uploads)
// This tells Multer where to save the MP3s
const storage = multer.diskStorage({
    destination: './music', // Save to music folder
    filename: function (req, file, cb) {
        // Keep original name but remove spaces to avoid bugs
        const cleanName = file.originalname.replace(/\s+/g, '_');
        cb(null, cleanName);
    }
});
const upload = multer({ storage: storage });

// --- ROUTES ---

// [A] GET All Songs
app.get('/api/songs', async (req, res) => {
    try {
        const songs = await Song.find().sort({ addedAt: -1 }); // Newest first
        res.json(songs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// [B] STREAM Music (The Magic One-Liner) 🪄
app.get('/music/:filename', (req, res) => {
    const filePath = path.join(__dirname, 'music', req.params.filename);
    
    // Express handles the Stream/Range logic automatically!
    res.sendFile(filePath); 
});

// [C] UPLOAD Endpoint 📤
app.post('/api/upload', upload.single('songFile'), async (req, res) => {
    // 1. Multer has already saved the file to /music by now.
    // 2. We just need to save the info to MongoDB.
    
    try {
        const newSong = new Song({
            title: req.body.title || req.file.originalname, // Use filename if no title
            artist: req.body.artist || "Unknown Artist",
            filename: req.file.filename,
            image: "http://192.168.1.37:8000/public/logo.png"
        });

        await newSong.save();
        console.log(`✅ Uploaded: ${newSong.title}`);
        res.json({ message: "Upload Successful!", song: newSong });

    } catch (err) {
        res.status(500).json({ error: "Upload failed" });
    }
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Express Server running on Port ${PORT}`);
});
