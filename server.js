require('dotenv').config(); // Load the .env file
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');      
const bcrypt = require('bcryptjs');      

const Song = require('./models/Song');
const User = require('./models/User');

const app = express();
const PORT = 8000;


const JWT_SECRET = process.env.JWT_SECRET;

// Middleware
app.use(cors());
app.use(express.json());
// Serve static files (Images, CSS, etc.)
app.use('/public', express.static('public'));
app.use('/music', express.static('music'));
app.use('/covers', express.static(path.join(__dirname, 'covers')));
//MONGO URL

const MONGO_URI = process.env.MONGO_URI; 

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.log("❌ DB Error:", err));

// ---  THE BOUNCER mheuhahahahhahahahahaha (Middleware) ---

const auth = (req, res, next) => {
    const token = req.header('auth-token');
    if (!token) return res.status(401).json({ error: "Access Denied. Who are you?" });

    try {
        const verified = jwt.verify(token, JWT_SECRET);
        req.user = verified;
        next(); 
    } catch (err) {
        res.status(400).json({ error: "Invalid Token. Nice try." });
    }
};

// --- Freaking STORAGE ENGINE LAMO Mritiyu---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, './public');
        } else {
            cb(null, './music');
        }
    },
    filename: function (req, file, cb) {
        const cleanName = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
        cb(null, cleanName);
    }
});

const upload = multer({ storage: storage }).fields([
    { name: 'songFile', maxCount: 1 },
    { name: 'imageFile', maxCount: 1 }
]);

// ================= ROUTES =================

// 1. 🔐 LOGIN ROUTE (Updated for Roles)
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    
    // Check if user exists
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: "User not found" });

    // Check password
    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) return res.status(400).json({ error: "Wrong password" });

    // Create Token with Role! 🏷️
    // If the username is EXACTLY your admin name, give them 'admin' role
    // Otherwise, give them 'user' role.
    const role = user.username === 'amex'? 'admin' : 'user'; 

    const token = jwt.sign({ _id: user._id, role: role }, JWT_SECRET);
    res.json({ token: token, username: user.username, role: role });
});

// 2.  Song getter
app.get('/api/songs', async (req, res) => {
    // Check if the user sent a token in the header
    const token = req.header('auth-token');
    let isVIP = false;

    // Verify the token if it exists
    if (token) {
        try {
            jwt.verify(token, JWT_SECRET);
            isVIP = true; // We are the Piracy King! LoL
        } catch(e) {
            isVIP = false;
        }
    }

    try {
        let songs;
        if (isVIP) {
            // Admin sees EVERYTHING
            songs = await Song.find().sort({ uploadedAt: -1 });
        } else {
            // Public sees only PUBLIC songs
            songs = await Song.find({ isPrivate: false }).sort({ uploadedAt: -1 });
        }
        res.json(songs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// 🔄 TOGGLE SONG PRIVACY (Admin Switch)
app.put('/api/songs/:id/toggle-privacy', async (req, res) => {
    try {
        // Find the song by its ID
        const song = await Song.findById(req.params.id);
        if (!song) return res.status(404).json({ error: "Song not found" });

        // Flip the switch (If true, make false. If false, make true)
        song.isPrivate = !song.isPrivate; 
        await song.save();

        res.json(song); // Send the updated song back to the frontend
    } catch (err) {
        console.error("Toggle error:", err);
        res.status(500).json({ error: "Server error while toggling privacy" });
    }
});

// 3. 📤 UPLOAD (Protected by 'auth' middleware)

app.post('/api/upload', auth, upload, async (req, res) => {
    try {
        const songFile = req.files['songFile'][0];
        const imageFile = req.files['imageFile'] ? req.files['imageFile'][0] : null;

        
        const BASE_URL = "http://192.168.1.37:8000"; 

        const newSong = new Song({
            title: req.body.title || songFile.originalname,
            artist: req.body.artist || "Unknown Artist",
            filename: songFile.filename,
            image: imageFile ? `${BASE_URL}/public/${imageFile.filename}` : `${BASE_URL}/public/logo.png`,
            isPrivate: req.body.isPrivate === 'true' 
        });

        await newSong.save();
        res.json({ message: "Upload Successful!", song: newSong });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Upload failed" });
    }
});

// 4. 🗑️ DELETE (Protected by 'auth')
app.delete('/api/songs/:id', auth, async (req, res) => {
    try {
        const song = await Song.findById(req.params.id);
        if (!song) return res.status(404).json({ error: "Song not found" });

        // Delete MP3
        const filePath = path.join(__dirname, 'music', song.filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        // Delete DB Entry
        await Song.findByIdAndDelete(req.params.id);
        
        res.json({ message: "Song deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: "Delete failed" });
    }
});

app.listen(PORT, () => console.log(`🚀 Server locked and loaded on port ${PORT}`));
