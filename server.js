require('dotenv').config(); // Load the .env file

const crypto = require('crypto');
const Invite = require('./models/Invite'); // Adjust path if needed

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
const Playlist = require('./models/Playlist');

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

    // 🧨 1. THE TRAPDOOR (5-Minute Guest Pass)
    // If they use the public guest credentials...
  
if (username?.trim().toLowerCase() === 'freetrial' && password?.trim() === 'justcheckingout')  {
        
        // Issue a token that self-destructs in 5 minutes
        const token = jwt.sign(
            { _id: 'guest_id', role: 'guest' }, // Payload
            process.env.JWT_SECRET,             // Secret Key
            { expiresIn: '7m' }                 // ⏳ EXPIRATION TIMER
        );
        
        return res.json({ 
            message: "Welcome to the Premium Copyright Songs. You have 7 minutes free Trial.", 
            token: token, 
            role: 'guest', 
            username: 'Guest User' 
        });
    }

    // 👑 2. STANDARD LOGIN (Database Check)
    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ error: "User not found" });

        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) return res.status(400).json({ error: "Wrong password" });

        // Admin gets 'admin' role, everyone else gets 'user'
        const role = user.username === 'amex' ? 'admin' : 'user';

        // Standard tokens last 7 days
        const token = jwt.sign(
            { _id: user._id, role: role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '7d' } 
        );

        res.json({ token, username: user.username, role: role });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});
// 📝 SIGNUP ROUTE (The VIP Entrance)
app.post('/api/signup', async (req, res) => {
    const { username, password, inviteCode } = req.body;

    try {
        // 1. Verify the Invite Code exists
        const validInvite = await Invite.findOne({ code: inviteCode });
        if (!validInvite) {
            return res.status(400).json({ error: "Nice Try Diddy : Invalid or expired invite code." });
        }

        // 2. Check if the username is already taken
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: "Username is already taken." });
        }

        // 3. Hash the password for security
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 4. Create the new permanent user
        const newUser = new User({
            username: username,
            password: hashedPassword
        });
        await newUser.save();

        // 5. 🔥 BURN THE CODE (The Single-Use Magic)
        await Invite.deleteOne({ code: inviteCode });

        res.json({ message: "Welcome to the Vault! Account created successfully." });

    } catch (err) {
        console.error("Signup Error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
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

        // ✅ THE BULLETPROOF WAY: Save ONLY the relative path. 
        // No BASE_URL, no IP addresses, no ports.
        const newSong = new Song({
            title: req.body.title || songFile.originalname,
            artist: req.body.artist || "Unknown Artist",
            filename: songFile.filename,
            
            // Just the folder and the filename!
            image: imageFile ? `/public/${imageFile.filename}` : `/public/logo.png`,
            isPrivate: req.body.isPrivate === 'true' 
        });

        await newSong.save();
        res.json({ message: "Upload Successful!", song: newSong });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Upload failed" });
    }
});
// 🎟️ GENERATE INVITE CODE (Admin Only)
app.post('/api/invites/generate', async (req, res) => {
    // 1. Security Check: Only you (the Admin) can generate codes
    const token = req.header('auth-token');
    if (!token) return res.status(401).json({ error: 'Access Denied' });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        if (verified.role !== 'admin') {
            return res.status(403).json({ error: 'Nice try. Admins only.' });
        }

        // 2. Generate a random 6-character hex code
        const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
        const newCode = `SUDO-${randomHex}`; // Looks like: SUDO-4F8A9B

        // 3. Save to Database
        const invite = new Invite({ code: newCode });
        await invite.save();

        res.json({ message: 'Invite code generated!', code: newCode });

    } catch (err) {
        console.error("Error generating code:", err);
        res.status(500).json({ error: 'Server error' });
    }
});

// 🗑️ DELETE SONG (Database Only)
app.delete('/api/songs/:id', auth, async (req, res) => {
    try {
        // 1. Ensure the user is an Admin (Extra Security layer)
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: "Access Denied: Only the Piracy King can delete songs. 🏴‍☠️" });
        }

        // 2. Find the song and remove it from the MongoDB database
        const deletedSong = await Song.findByIdAndDelete(req.params.id);

        if (!deletedSong) {
            return res.status(404).json({ error: "Song not found in the vault." });
        }

        /* * 🛑 INTENTIONAL OMISSION: 
         * We are NOT using the 'fs' module to delete the physical files from the 
         * /music or /covers folders. The files remain safe on your hard drive!
         */

        res.json({ message: "Song successfully wiped from the database.", song: deletedSong });

    } catch (err) {
        console.error("Delete Error:", err);
        res.status(500).json({ error: "Internal Server Error during deletion." });
    }
});

// ================= PLAYLIST ROUTES =================

// Helper: block guests from playlist actions
const noGuests = (req, res, next) => {
    if (req.user.role === 'guest') {
        return res.status(403).json({ error: "Guests can't create playlists. Get a permanent account!" });
    }
    next();
};

// 📋 GET all playlists for the logged-in user (populated with song data)
app.get('/api/playlists', auth, noGuests, async (req, res) => {
    try {
        const playlists = await Playlist.find({ owner: req.user._id })
            .populate('songs')
            .sort({ createdAt: -1 });
        res.json(playlists);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ➕ CREATE a new playlist
app.post('/api/playlists', auth, noGuests, async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || !name.trim()) return res.status(400).json({ error: "Playlist name is required." });

        const playlist = new Playlist({
            name: name.trim(),
            owner: req.user._id,
            songs: []
        });
        await playlist.save();
        res.json(playlist);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🗑️ DELETE a playlist
app.delete('/api/playlists/:id', auth, noGuests, async (req, res) => {
    try {
        const playlist = await Playlist.findOne({ _id: req.params.id, owner: req.user._id });
        if (!playlist) return res.status(404).json({ error: "Playlist not found or not yours." });

        await Playlist.findByIdAndDelete(req.params.id);
        res.json({ message: "Playlist deleted." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🎵 ADD a song to a playlist
app.post('/api/playlists/:id/songs', auth, noGuests, async (req, res) => {
    try {
        const { songId } = req.body;
        const playlist = await Playlist.findOne({ _id: req.params.id, owner: req.user._id });
        if (!playlist) return res.status(404).json({ error: "Playlist not found or not yours." });

        // Prevent duplicates
        if (playlist.songs.includes(songId)) {
            return res.status(400).json({ error: "Song already in this playlist." });
        }

        playlist.songs.push(songId);
        await playlist.save();

        // Return the updated playlist populated with song data
        const updated = await Playlist.findById(playlist._id).populate('songs');
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ❌ REMOVE a song from a playlist
app.delete('/api/playlists/:id/songs/:songId', auth, noGuests, async (req, res) => {
    try {
        const playlist = await Playlist.findOne({ _id: req.params.id, owner: req.user._id });
        if (!playlist) return res.status(404).json({ error: "Playlist not found or not yours." });

        playlist.songs = playlist.songs.filter(s => s.toString() !== req.params.songId);
        await playlist.save();

        const updated = await Playlist.findById(playlist._id).populate('songs');
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => console.log(`🚀 Server locked and loaded on port ${PORT}`));
