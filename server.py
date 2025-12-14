#!/usr/bin/env python3
"""
Simple Python server for AGBAY viewer count tracking
Optimized for Raspberry Pi Zero 2 W
Works without npm/Node.js - uses only Python standard library
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse
import json
import time
import threading
from datetime import datetime
import os

PORT = 3000
viewers = {}  # Store active viewers: {viewer_id: last_ping_timestamp}
VIEWER_TIMEOUT = 10  # 10 seconds - if no ping, viewer is considered offline
cleanup_interval = 5  # Clean up every 5 seconds
MAX_VIEWERS = 100  # Limit for Raspberry Pi Zero 2 W (low memory device)
CLASSROOM_FOLDER = 'classroom'  # Folder containing classroom materials
file_views = {}  # Track views per file: {filename: view_count}

def generate_viewer_id():
    """Generate a unique viewer ID"""
    import random
    import string
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=16))

def cleanup_inactive_viewers():
    """Remove viewers that haven't pinged recently (optimized for Pi Zero 2 W)"""
    while True:
        try:
            current_time = time.time()
            inactive = [vid for vid, timestamp in viewers.items() 
                       if current_time - timestamp > VIEWER_TIMEOUT]
            for vid in inactive:
                del viewers[vid]
            if inactive:
                print(f"Cleaned up {len(inactive)} inactive viewer(s) (Total: {len(viewers)})")
        except Exception as e:
            print(f"Cleanup error: {e}")
        time.sleep(cleanup_interval)

# Start cleanup thread
cleanup_thread = threading.Thread(target=cleanup_inactive_viewers, daemon=True)
cleanup_thread.start()

class AGBAYHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_GET(self):
        """Handle GET requests"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        if path == '/api/viewers':
            # Get viewer count
            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            response = {'count': len(viewers)}
            self.wfile.write(json.dumps(response).encode())
        elif path == '/api/classroom/files':
            # List all files in classroom folder
            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            files = self.list_classroom_files()
            self.wfile.write(json.dumps(files).encode())
        elif path.startswith('/api/classroom/view/'):
            # Track file view
            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            filename = path.replace('/api/classroom/view/', '')
            if filename:
                from urllib.parse import unquote
                filename = unquote(filename)  # Properly decode URL encoding
                if filename not in file_views:
                    file_views[filename] = 0
                file_views[filename] += 1
                print(f"File view tracked: {filename} (Total views: {file_views[filename]})")
                response = {'filename': filename, 'views': file_views[filename]}
                self.wfile.write(json.dumps(response).encode())
        elif path.startswith('/classroom/'):
            # Serve files from classroom folder
            filename = path.replace('/classroom/', '')
            self.serve_classroom_file(filename)
        else:
            # Try to serve static files
            self.serve_static_file(path)
    
    def do_POST(self):
        """Handle POST requests"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        # Read request body
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8')
        
        # CORS headers
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        
        if path == '/api/viewers/join':
            # Register new viewer (with limit for Pi Zero 2 W)
            if len(viewers) >= MAX_VIEWERS:
                response = {'error': 'Server at capacity', 'count': len(viewers)}
            else:
                viewer_id = generate_viewer_id()
                viewers[viewer_id] = time.time()
                print(f"Viewer joined: {viewer_id[:8]}... (Total: {len(viewers)})")
                response = {'viewerId': viewer_id, 'count': len(viewers)}
            self.wfile.write(json.dumps(response).encode())
        
        elif path == '/api/viewers/ping':
            # Ping from existing viewer
            try:
                data = json.loads(body)
                viewer_id = data.get('viewerId')
                if viewer_id and viewer_id in viewers:
                    viewers[viewer_id] = time.time()  # Update timestamp
            except:
                pass
            response = {'count': len(viewers)}
            self.wfile.write(json.dumps(response).encode())
        
        elif path == '/api/viewers/leave':
            # Viewer leaving (optional - cleanup handles this)
            response = {'count': len(viewers)}
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_error(404)
    
    def list_classroom_files(self):
        """List all files in the classroom folder with view counts"""
        files = []
        classroom_path = CLASSROOM_FOLDER
        
        if not os.path.exists(classroom_path):
            try:
                os.makedirs(classroom_path, exist_ok=True)
                print(f"Created classroom folder: {os.path.abspath(classroom_path)}")
            except Exception as e:
                print(f"Error creating classroom folder: {e}")
            return files
        
        try:
            for filename in os.listdir(classroom_path):
                file_path = os.path.join(classroom_path, filename)
                if os.path.isfile(file_path):
                    # Get file info
                    file_size = os.path.getsize(file_path)
                    file_ext = os.path.splitext(filename)[1].lower()
                    
                    # Get view count
                    views = file_views.get(filename, 0)
                    
                    # Determine file type icon
                    icon = '📄'
                    if file_ext == '.pdf':
                        icon = '📕'
                    elif file_ext in ['.pptx', '.ppt']:
                        icon = '📊'
                    elif file_ext in ['.doc', '.docx']:
                        icon = '📝'
                    elif file_ext in ['.jpg', '.jpeg', '.png', '.gif']:
                        icon = '🖼️'
                    elif file_ext in ['.mp4', '.avi', '.mov']:
                        icon = '🎥'
                    
                    files.append({
                        'name': filename,
                        'size': file_size,
                        'extension': file_ext,
                        'icon': icon,
                        'views': views,
                        'url': f'/classroom/{filename}'
                    })
            
            # Sort by name
            files.sort(key=lambda x: x['name'].lower())
        except Exception as e:
            print(f"Error listing classroom files: {e}")
        
        return files
    
    def serve_classroom_file(self, filename):
        """Serve a file from the classroom folder"""
        from urllib.parse import unquote
        # Security: prevent directory traversal
        filename = unquote(filename)  # Decode URL encoding
        filename = os.path.basename(filename)  # Remove any path components
        file_path = os.path.join(CLASSROOM_FOLDER, filename)
        
        # Security: ensure file is within classroom folder
        abs_classroom = os.path.abspath(CLASSROOM_FOLDER)
        abs_file = os.path.abspath(file_path)
        
        if not abs_file.startswith(abs_classroom):
            self.send_response(403)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            return
        
        if not os.path.exists(file_path) or not os.path.isfile(file_path):
            print(f"Classroom file not found: {file_path}")
            self.send_response(404)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            return
        
        # Determine content type
        ext = os.path.splitext(filename)[1].lower()
        content_type = 'application/octet-stream'
        
        content_types = {
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
        }
        
        content_type = content_types.get(ext, 'application/octet-stream')
        
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Disposition', f'inline; filename="{filename}"')
        self.end_headers()
        
        # Stream file in chunks
        try:
            with open(file_path, 'rb') as f:
                chunk_size = 8192
                while True:
                    chunk = f.read(chunk_size)
                    if not chunk:
                        break
                    self.wfile.write(chunk)
        except Exception as e:
            print(f"Error serving classroom file {filename}: {e}")
            self.send_error(500)
    
    def serve_static_file(self, path):
        """Serve static files (HTML, CSS, JS, PDFs) - optimized for Pi Zero 2 W"""
        if path == '/':
            path = '/index.html'
        
        file_path = '.' + path
        
        # Security: prevent directory traversal
        if '..' in path or not os.path.abspath(file_path).startswith(os.path.abspath('.')):
            self.send_response(403)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            return
        
        if os.path.exists(file_path) and os.path.isfile(file_path):
            # Determine content type
            content_type = 'text/html; charset=utf-8'
            if path.endswith('.css'):
                content_type = 'text/css; charset=utf-8'
            elif path.endswith('.js'):
                content_type = 'text/javascript; charset=utf-8'
            elif path.endswith('.json'):
                content_type = 'application/json; charset=utf-8'
            elif path.endswith('.pdf'):
                content_type = 'application/pdf'
            elif path.endswith('.png'):
                content_type = 'image/png'
            elif path.endswith('.jpg') or path.endswith('.jpeg'):
                content_type = 'image/jpeg'
            elif path.endswith('.svg'):
                content_type = 'image/svg+xml'
            
            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Type', content_type)
            # Add cache headers for better performance on Pi Zero 2 W
            if path.endswith(('.css', '.js', '.png', '.jpg', '.jpeg', '.svg')):
                self.send_header('Cache-Control', 'public, max-age=3600')
            self.end_headers()
            
            # Stream file in chunks for better memory usage on Pi Zero 2 W
            try:
                with open(file_path, 'rb') as f:
                    chunk_size = 8192  # 8KB chunks
                    while True:
                        chunk = f.read(chunk_size)
                        if not chunk:
                            break
                        self.wfile.write(chunk)
            except Exception as e:
                print(f"Error serving file {file_path}: {e}")
                self.send_response(500)
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
        else:
            print(f"File not found: {file_path} (cwd: {os.getcwd()})")
            self.send_response(404)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
    
    def log_message(self, format, *args):
        """Override to customize log format"""
        # Only log errors, not every request (to reduce noise)
        if len(args) > 0 and ('404' in str(args[0]) or '500' in str(args[0]) or '403' in str(args[0])):
            print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {args[0]}")

def run_server():
    """Start the server - optimized for Raspberry Pi Zero 2 W"""
    # Get the directory where server.py is located
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)  # Change to server's directory so relative paths work
    
    # Ensure classroom folder exists
    classroom_path = os.path.join(script_dir, CLASSROOM_FOLDER)
    if not os.path.exists(classroom_path):
        try:
            os.makedirs(classroom_path, exist_ok=True)
            print(f"📁 Created classroom folder: {classroom_path}")
        except Exception as e:
            print(f"⚠️  Could not create classroom folder: {e}")
    else:
        print(f"📁 Classroom folder: {classroom_path}")
    
    server_address = ('', PORT)
    httpd = HTTPServer(server_address, AGBAYHandler)
    
    # Get IP address for display
    import socket
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip_address = s.getsockname()[0]
        s.close()
    except:
        ip_address = "localhost"
    
    print("=" * 50)
    print(f"🚀 AGBAY Server - Raspberry Pi Zero 2 W")
    print(f"📡 Running on http://0.0.0.0:{PORT}")
    print(f"💻 Local access: http://localhost:{PORT}")
    print(f"📱 Network access: http://{ip_address}:{PORT}")
    print(f"📊 Viewer tracking enabled (Max: {MAX_VIEWERS})")
    print("=" * 50)
    print(f"Press Ctrl+C to stop")
    print("")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Server stopped")
        httpd.server_close()

if __name__ == '__main__':
    run_server()

