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
ExecStart=/usr/bin/python3 $CURRENT_DIR/server.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

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
echo "Useful commands:"
echo "  Start service now:     sudo systemctl start agbay"
echo "  Stop service:          sudo systemctl stop agbay"
echo "  Restart service:       sudo systemctl restart agbay"
echo "  Check status:          sudo systemctl status agbay"
echo "  View logs:             sudo journalctl -u agbay -f"
echo "  Disable auto-start:    sudo systemctl disable agbay"
echo ""
echo "To test, you can start it now with:"
echo "  sudo systemctl start agbay"
echo ""
echo "Then check status with:"
echo "  sudo systemctl status agbay"
echo ""

