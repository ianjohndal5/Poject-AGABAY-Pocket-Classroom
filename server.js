// Simple Node.js server for viewer count tracking
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;
const viewers = new Map(); // Store active viewers with their timestamps
const VIEWER_TIMEOUT = 10000; // 10 seconds - if no ping, viewer is considered offline

// Clean up inactive viewers periodically
setInterval(() => {
    const now = Date.now();
    for (const [id, timestamp] of viewers.entries()) {
        if (now - timestamp > VIEWER_TIMEOUT) {
            viewers.delete(id);
            console.log(`Viewer ${id} timed out`);
        }
    }
}, 5000); // Check every 5 seconds

// Generate unique viewer ID
function generateViewerId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // API Routes
    if (pathname === '/api/viewers') {
        if (req.method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ count: viewers.size }));
            return;
        }
    }
    
    if (pathname === '/api/viewers/join') {
        if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', () => {
                const viewerId = generateViewerId();
                viewers.set(viewerId, Date.now());
                console.log(`Viewer joined: ${viewerId} (Total: ${viewers.size})`);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ viewerId, count: viewers.size }));
            });
            return;
        }
    }
    
    if (pathname === '/api/viewers/leave') {
        if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', () => {
                // In a real implementation, you'd track viewer IDs
                // For simplicity, we'll just decrease count
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ count: viewers.size }));
            });
            return;
        }
    }
    
    if (pathname === '/api/viewers/ping') {
        if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', () => {
                try {
                    const data = JSON.parse(body);
                    if (data.viewerId && viewers.has(data.viewerId)) {
                        viewers.set(data.viewerId, Date.now()); // Update timestamp
                    }
                } catch (e) {
                    // Ignore parse errors
                }
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ count: viewers.size }));
            });
            return;
        }
    }
    
    // Serve static files
    let filePath = '.' + pathname;
    if (filePath === './') {
        filePath = './index.html';
    }
    
    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.pdf': 'application/pdf'
    };
    
    const contentType = mimeTypes[extname] || 'application/octet-stream';
    
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end('Server error: ' + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`🚀 AGBAY Server running on http://localhost:${PORT}`);
    console.log(`📊 Viewer tracking enabled`);
});

