const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    // fixing CORS HEADERS 
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // this will handl Pre flight checks
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const filePath = path.join(__dirname, 'music', 'song.mp3');
    
    fs.stat(filePath, (err, stats) => {
        if (err) {
            console.error('File not found:', filePath);
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Song not found!');
            return;
        }

        const range = req.headers.range;
        const fileSize = stats.size;

        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunksize = (end - start) + 1;
            const file = fs.createReadStream(filePath, { start, end });
            
            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': 'audio/mpeg',
                // added CORS here too just in case iykyk ;)
                'Access-Control-Allow-Origin': '*',
            };
            
            res.writeHead(206, head);
            file.pipe(res);
        } else {
            const head = {
                'Content-Length': fileSize,
                'Content-Type': 'audio/mpeg',
                'Access-Control-Allow-Origin': '*',
            };
            
            res.writeHead(200, head);
            fs.createReadStream(filePath).pipe(res);
        }
    });
});

const PORT = 8000;
server.listen(PORT,'0.0.0.0', () => {
    console.log(`⚡ SudoStream Audio Engine (CORS Enabled) running on http://localhost:${PORT}`);
});
