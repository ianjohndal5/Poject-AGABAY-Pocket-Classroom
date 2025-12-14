// Express server for AGBAY Pocket Classroom
// Optimized for Raspberry Pi Zero 2 W
const express = require('express');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
const PORT = 3000;
const CLASSROOM_FOLDER = 'classroom';
const MAX_VIEWERS = 100; // Limit for Raspberry Pi Zero 2 W (low memory device)

// Store active viewers with their timestamps
const viewers = new Map();
const VIEWER_TIMEOUT = 10000; // 10 seconds - if no ping, viewer is considered offline
const fileViews = {}; // Track views per file: {filename: view_count}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Clean up inactive viewers periodically
setInterval(() => {
    const now = Date.now();
    for (const [id, timestamp] of viewers.entries()) {
        if (now - timestamp > VIEWER_TIMEOUT) {
            viewers.delete(id);
            console.log(`Viewer ${id.substring(0, 8)}... timed out`);
        }
    }
}, 5000); // Check every 5 seconds

// Generate unique viewer ID
function generateViewerId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Ensure classroom folder exists
if (!fs.existsSync(CLASSROOM_FOLDER)) {
    try {
        fs.mkdirSync(CLASSROOM_FOLDER, { recursive: true });
        console.log(`📁 Created classroom folder: ${path.resolve(CLASSROOM_FOLDER)}`);
    } catch (error) {
        console.error(`⚠️  Could not create classroom folder: ${error.message}`);
    }
}

// API Routes

// Get viewer count
app.get('/api/viewers', (req, res) => {
    res.json({ count: viewers.size });
});

// Join as viewer
app.post('/api/viewers/join', (req, res) => {
    if (viewers.size >= MAX_VIEWERS) {
        return res.json({ error: 'Server at capacity', count: viewers.size });
    }
    const viewerId = generateViewerId();
    viewers.set(viewerId, Date.now());
    console.log(`Viewer joined: ${viewerId.substring(0, 8)}... (Total: ${viewers.size})`);
    res.json({ viewerId, count: viewers.size });
});

// Ping to keep viewer active
app.post('/api/viewers/ping', (req, res) => {
    try {
        const { viewerId } = req.body;
        if (viewerId && viewers.has(viewerId)) {
            viewers.set(viewerId, Date.now()); // Update timestamp
        }
    } catch (e) {
        // Ignore parse errors
    }
    res.json({ count: viewers.size });
});

// Leave (optional - cleanup handles this)
app.post('/api/viewers/leave', (req, res) => {
    res.json({ count: viewers.size });
});

// List classroom files
app.get('/api/classroom/files', (req, res) => {
    const files = [];
    const classroomPath = path.resolve(CLASSROOM_FOLDER);
    
    if (!fs.existsSync(classroomPath)) {
        return res.json([]);
    }
    
    try {
        const fileList = fs.readdirSync(classroomPath);
        
        fileList.forEach(filename => {
            const filePath = path.join(classroomPath, filename);
            if (fs.statSync(filePath).isFile()) {
                const fileSize = fs.statSync(filePath).size;
                const fileExt = path.extname(filename).toLowerCase();
                
                // Get view count
                const views = fileViews[filename] || 0;
                
                // Determine file type icon
                let icon = '📄';
                if (fileExt === '.pdf') {
                    icon = '📕';
                } else if (fileExt === '.pptx' || fileExt === '.ppt') {
                    icon = '📊';
                } else if (fileExt === '.doc' || fileExt === '.docx') {
                    icon = '📝';
                } else if (['.jpg', '.jpeg', '.png', '.gif'].includes(fileExt)) {
                    icon = '🖼️';
                } else if (['.mp4', '.avi', '.mov'].includes(fileExt)) {
                    icon = '🎥';
                }
                
                files.push({
                    name: filename,
                    size: fileSize,
                    extension: fileExt,
                    icon: icon,
                    views: views,
                    url: `/classroom/${encodeURIComponent(filename)}`
                });
            }
        });
        
        // Sort by name
        files.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
    } catch (error) {
        console.error(`Error listing classroom files: ${error.message}`);
    }
    
    res.json(files);
});

// Track file view
app.get('/api/classroom/view/:filename', (req, res) => {
    const filename = decodeURIComponent(req.params.filename);
    if (filename) {
        if (!fileViews[filename]) {
            fileViews[filename] = 0;
        }
        fileViews[filename]++;
        console.log(`File view tracked: ${filename} (Total views: ${fileViews[filename]})`);
        res.json({ filename, views: fileViews[filename] });
    } else {
        res.json({ error: 'Invalid filename' });
    }
});

// Serve files from classroom folder
app.get('/classroom/:filename', (req, res) => {
    const filename = decodeURIComponent(req.params.filename);
    // Security: prevent directory traversal
    const safeFilename = path.basename(filename);
    const filePath = path.join(CLASSROOM_FOLDER, safeFilename);
    
    // Security: ensure file is within classroom folder
    const absClassroom = path.resolve(CLASSROOM_FOLDER);
    const absFile = path.resolve(filePath);
    
    if (!absFile.startsWith(absClassroom)) {
        return res.status(403).send('Forbidden');
    }
    
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
        console.log(`Classroom file not found: ${filePath}`);
        return res.status(404).send('File not found');
    }
    
    // Determine content type
    const ext = path.extname(filename).toLowerCase();
    const contentTypes = {
        '.pdf': 'application/pdf',
        '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        '.ppt': 'application/vnd.ms-powerpoint',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.mp4': 'video/mp4',
        '.txt': 'text/plain',
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'text/javascript'
    };
    
    const contentType = contentTypes[ext] || 'application/octet-stream';
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.sendFile(path.resolve(filePath));
});

// Serve static files (HTML, CSS, JS, PDFs, etc.)
app.use(express.static('.', {
    index: 'index.html',
    setHeaders: (res, filePath) => {
        // Add cache headers for better performance on Pi Zero 2 W
        const ext = path.extname(filePath).toLowerCase();
        if (['.css', '.js', '.png', '.jpg', '.jpeg', '.svg'].includes(ext)) {
            res.setHeader('Cache-Control', 'public, max-age=3600');
        }
    }
}));

// Get IP address for display
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

// Start server
app.listen(PORT, '0.0.0.0', () => {
    const ipAddress = getLocalIP();
    console.log('='.repeat(50));
    console.log('🚀 AGBAY Server - Raspberry Pi Zero 2 W');
    console.log(`📡 Running on http://0.0.0.0:${PORT}`);
    console.log(`💻 Local access: http://localhost:${PORT}`);
    console.log(`📱 Network access: http://${ipAddress}:${PORT}`);
    console.log(`📊 Viewer tracking enabled (Max: ${MAX_VIEWERS})`);
    console.log('='.repeat(50));
    console.log('Press Ctrl+C to stop');
    console.log('');
});

