#!/bin/bash
# Installation script for auto-starting AGBAY server on Raspberry Pi Zero 2 W
# This script sets up systemd service to start server on boot

echo "=========================================="
echo "AGBAY Auto-Start Installation"
echo "Raspberry Pi Zero 2 W"
echo "=========================================="
echo ""

# Get current directory
CURRENT_DIR=$(pwd)
echo "Current directory: $CURRENT_DIR"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "This script needs to be run with sudo"
    echo "Usage: sudo ./install_autostart.sh"
    exit 1
fi

# Get the user who ran sudo (usually 'pi')
SUDO_USER=${SUDO_USER:-$USER}
if [ "$SUDO_USER" = "root" ]; then
    SUDO_USER="pi"
fi

echo "Installing for user: $SUDO_USER"
echo ""

# Find Node.js path
echo "Detecting Node.js installation..."
NODE_PATH=$(which node 2>/dev/null || echo "/usr/bin/node")

# If node not found in PATH, try common locations
if [ ! -f "$NODE_PATH" ]; then
    if [ -f "/usr/local/bin/node" ]; then
        NODE_PATH="/usr/local/bin/node"
    elif [ -f "/usr/bin/nodejs" ]; then
        NODE_PATH="/usr/bin/nodejs"
    else
        echo "WARNING: Node.js not found! Trying default path /usr/bin/node"
        echo "If this fails, install Node.js first:"
        echo "  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
        echo "  sudo apt-get install -y nodejs"
        NODE_PATH="/usr/bin/node"
    fi
fi

echo "Using Node.js at: $NODE_PATH"
echo ""

# Verify Node.js works
if [ -f "$NODE_PATH" ]; then
    NODE_VERSION=$($NODE_PATH --version 2>/dev/null || echo "unknown")
    echo "Node.js version: $NODE_VERSION"
else
    echo "WARNING: Node.js executable not found at $NODE_PATH"
    echo "The service may not start correctly. Please install Node.js first."
fi
echo ""

# Check if npm dependencies are installed
if [ ! -d "$CURRENT_DIR/node_modules" ]; then
    echo "WARNING: node_modules directory not found!"
    echo "Installing dependencies..."
    cd "$CURRENT_DIR"
    if command -v npm &> /dev/null; then
        npm install
    else
        echo "ERROR: npm not found! Please install Node.js and npm first."
        exit 1
    fi
fi

# Create systemd service file
SERVICE_FILE="/etc/systemd/system/agbay.service"

echo "Creating systemd service file..."
cat > "$SERVICE_FILE" << EOF
[Unit]
Description=AGBAY Pocket Classroom Server
After=network.target
Wants=network-online.target

[Service]
Type=simple
User=$SUDO_USER
WorkingDirectory=$CURRENT_DIR
ExecStart=$NODE_PATH $CURRENT_DIR/server.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

echo "Service file created at: $SERVICE_FILE"
echo ""

# Reload systemd
echo "Reloading systemd daemon..."
systemctl daemon-reload

# Enable the service
echo "Enabling AGBAY service to start on boot..."
systemctl enable agbay.service

echo ""
echo "=========================================="
echo "Installation Complete!"
echo "=========================================="
echo ""
echo "The AGBAY server will now start automatically on boot."
echo ""

# Try to start the service immediately
echo "Starting AGBAY service now..."
if systemctl start agbay.service; then
    sleep 2
    if systemctl is-active --quiet agbay.service; then
        echo "✓ Service started successfully!"
        echo ""
        IP_ADDRESS=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "localhost")
        echo "Server is running at:"
        echo "  http://localhost:3000"
        if [ "$IP_ADDRESS" != "localhost" ]; then
            echo "  http://$IP_ADDRESS:3000"
        fi
    else
        echo "⚠ Service may have failed to start."
        echo "Check status with: sudo systemctl status agbay"
    fi
else
    echo "⚠ Could not start service automatically."
    echo "Start it manually with: sudo systemctl start agbay"
fi

echo ""
echo "=========================================="
echo "Useful Commands:"
echo "=========================================="
echo "  Start service now:     sudo systemctl start agbay"
echo "  Stop service:          sudo systemctl stop agbay"
echo "  Restart service:       sudo systemctl restart agbay"
echo "  Check status:          sudo systemctl status agbay"
echo "  View logs:             sudo journalctl -u agbay -f"
echo "  Disable auto-start:    sudo systemctl disable agbay"
echo ""
echo "The server will automatically start on every boot."
echo ""

