# AGBAY: Pocket Classroom

An offline learning platform with PDF knowledge base, AI assistant, and live classroom features.

## Features

- 📚 **PDF Knowledge Base**: Indexes and searches through multiple PDF documents
- 💬 **AI Assistant**: Ask questions and get answers from the PDF content
- 🏫 **Live Classroom**: Teachers can upload materials for students to view
- 👥 **Viewer Tracking**: See how many users are currently viewing the platform
- 📱 **Mobile Responsive**: Works on desktop, tablet, and mobile devices

## Setup Instructions

### For Raspberry Pi Zero 2 W (Recommended - No npm needed!)

The server is written in Python 3, optimized for Raspberry Pi Zero 2 W. Python 3 comes pre-installed on Raspberry Pi OS.

#### 1. Make the start script executable (Linux/Raspberry Pi):

```bash
chmod +x start_server.sh
```

#### 2. Start the Server:

**Option A - Using the script:**
```bash
./start_server.sh
```

**Option B - Direct Python command:**
```bash
python3 server.py
```

The server will run on `http://0.0.0.0:3000` (accessible from any device on your network)

#### 3. Find Your Raspberry Pi IP Address:

```bash
hostname -I
```

#### 4. Access from Other Devices:

- From Raspberry Pi: `http://localhost:3000`
- From other devices on network: `http://<raspberry-pi-ip>:3000`

#### 5. Auto-Start on Boot (Optional but Recommended):

To make the server start automatically when the Pi boots:

```bash
chmod +x install_autostart.sh
sudo ./install_autostart.sh
```

That's it! The server will now start automatically every time the Pi boots. See `RASPBERRY_PI_SETUP.md` for more details.

### For Windows/Mac (Development)

**Option A - Python (No npm needed):**
```bash
python3 server.py
# or
python server.py
```

**Option B - Using batch file (Windows):**
```bash
start_server.bat
```

**Option C - Node.js (if you have npm installed):**
```bash
npm install
npm start
```

### Without Server

Simply open `index.html` in your browser (viewer tracking won't work, but all other features will)

## Usage

### For Students

1. Wait for the PDF knowledge base to load (you'll see progress from 0% to 100%)
2. Ask questions in the chat box
3. View retrieved content in the lesson view area
4. Click source links to view full PDFs
5. Access the Classroom section to view materials shared by teachers

### For Teachers

1. Click the "🏫 Classroom" button
2. Upload PDFs or presentations
3. Share materials with students
4. Monitor viewer count during class

## Configuration

### Change Server URL

If your server runs on a different port or URL, edit `script.js`:

```javascript
const SERVER_URL = 'http://localhost:3000'; // Change this
```

For Raspberry Pi accessed from other devices, use:
```javascript
const SERVER_URL = 'http://<raspberry-pi-ip>:3000';
```

### Enable Teacher Mode

To enable teacher panel, set in browser console:

```javascript
localStorage.setItem('isTeacher', 'true');
```

Then refresh the page.

## File Structure

```
Agabay/
├── index.html          # Main HTML file
├── script.js           # Main JavaScript logic
├── style.css           # Styling
├── server.py           # Python server for viewer tracking (Raspberry Pi - NO npm needed!)
├── server.js           # Node.js server (alternative, requires npm)
├── start_server.sh     # Bash script to start server (Linux/Raspberry Pi)
├── start_server.bat    # Batch script to start server (Windows)
├── package.json        # Node.js dependencies (optional)
└── documents/          # PDF files directory
    └── *.pdf           # Your PDF files
```

## Notes

- **Raspberry Pi Zero 2 W**: Use `server.py` (Python 3, no npm needed!) ✅
  - Optimized for low memory usage
  - Supports up to 100 concurrent viewers
  - Uses only Python standard library (no extra packages needed)
- **Windows/Mac**: Can use either `server.py` (Python) or `server.js` (Node.js)
- The viewer tracking feature requires the server to be running
- PDF indexing happens on page load and may take a moment
- The application works offline for PDF viewing, but viewer tracking needs the server
- On Raspberry Pi Zero 2 W, make sure port 3000 is accessible if accessing from other devices
- Python 3 is pre-installed on Raspberry Pi OS
- Server is lightweight and optimized for the Pi Zero 2 W's limited resources

## Troubleshooting

### Server won't start on Raspberry Pi Zero 2 W

1. Check if Python 3 is installed:
   ```bash
   python3 --version
   ```
   Should show Python 3.x.x (usually 3.7+ on Raspberry Pi OS)

2. If not installed (unlikely on Raspberry Pi OS):
   ```bash
   sudo apt-get update
   sudo apt-get install python3
   ```

3. Make sure port 3000 is not blocked by firewall:
   ```bash
   sudo ufw allow 3000
   ```

4. If you get "Permission denied" error, try:
   ```bash
   sudo python3 server.py
   ```
   (Note: Using sudo will run on port 3000, but you may need to change PORT in server.py to 8080 if 3000 requires root)

### Can't access from other devices

1. Make sure Raspberry Pi and other devices are on the same network
2. Check Raspberry Pi IP address: `hostname -I`
3. Try accessing from Raspberry Pi first: `http://localhost:3000`
4. If using firewall, allow port 3000:
   ```bash
   sudo ufw allow 3000
   ```
