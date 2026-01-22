const http = require('http');

const server = http.createServer((req, res) => {
    console.log(`[LOG] Request received for: ${req.url}`);
    
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('SudoStream: Root access granted. System Online.');
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`⚡ SudoStream is running on http://localhost:${PORT}`);
});