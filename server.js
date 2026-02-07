require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// --- 1. Database Connection ---
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Connected Successfully');
    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err.message);
    }
};
connectDB();

// --- 2. Define Schema ---
const SongSchema = new mongoose.Schema({
    title: String,
    artist: String,
    filename: String,
    image: String,
    addedAt: { type: Date, default: Date.now }
});
const Song = mongoose.model('Song', SongSchema);

// --- 3. The Server ---
const server = http.createServer(async (req, res) => {
    // CORS (Allow Frontend)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range'); // Added Range

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // [A] API Endpoint: List Songs
    if (req.url === '/api/songs' && req.method === 'GET') {
        try {
            const songs = await Song.find();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(songs));
            console.log("📤 Sent Song List to Client");
        } catch (error) {
            res.writeHead(500);
            res.end(JSON.stringify({ error: 'DB Error' }));
        }
        return;
    }

    // [B] Music Streaming Endpoint (The Smart Player)
    if (req.url.startsWith('/music/')) {
        // 1. Extract filename (e.g., "test.mp3")
        const filename = req.url.replace('/music/', '');
        const filePath = path.join(__dirname, 'music', filename);
        
        console.log(`🎵 Request for: ${filename}`); // DEBUG LOG

        // 2. Check if file exists
        fs.stat(filePath, (err, stats) => {
            if (err) {
                console.error(`❌ File MISSING: ${filePath}`);
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('File not found');
                return;
            }

            // 3. Stream logic
            const range = req.headers.range;
            const fileSize = stats.size;

            if (range) {
                const parts = range.replace(/bytes=/, "").split("-");
                const start = parseInt(parts[0], 10);
                const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
                const chunksize = (end - start) + 1;
                const file = fs.createReadStream(filePath, { start, end });
                
                res.writeHead(206, {
                    'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': chunksize,
                    'Content-Type': 'audio/mpeg',
                    'Access-Control-Allow-Origin': '*',
                });
                file.pipe(res);
            } else {
                res.writeHead(200, {
                    'Content-Length': fileSize,
                    'Content-Type': 'audio/mpeg',
                    'Access-Control-Allow-Origin': '*',
                });
                fs.createReadStream(filePath).pipe(res);
            }
        });
        return;
    }

    // [C] 404 for anything else
    res.writeHead(404);
    res.end('Not Found');
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`⚡ Server running on Port ${PORT}`);
});
