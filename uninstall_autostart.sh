#!/bin/bash
# Uninstall script to remove AGBAY auto-start service

echo "=========================================="
echo "AGBAY Auto-Start Uninstallation"
echo "=========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "This script needs to be run with sudo"
    echo "Usage: sudo ./uninstall_autostart.sh"
    exit 1
fi

# Stop the service
echo "Stopping AGBAY service..."
systemctl stop agbay.service 2>/dev/null

# Disable the service
echo "Disabling AGBAY service..."
systemctl disable agbay.service 2>/dev/null

# Remove service file
SERVICE_FILE="/etc/systemd/system/agbay.service"
if [ -f "$SERVICE_FILE" ]; then
    echo "Removing service file..."
    rm "$SERVICE_FILE"
fi

# Reload systemd
echo "Reloading systemd daemon..."
systemctl daemon-reload

echo ""
echo "=========================================="
echo "Uninstallation Complete!"
echo "=========================================="
echo ""
echo "AGBAY will no longer start automatically on boot."
echo "You can still start it manually with: python3 server.py"
echo ""

