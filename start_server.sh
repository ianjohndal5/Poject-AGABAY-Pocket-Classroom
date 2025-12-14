#!/bin/bash
# Simple bash script to start the Node.js server on Raspberry Pi

echo "Starting AGBAY Server..."
echo "Press Ctrl+C to stop"
echo ""

# Check if Node.js is available
if command -v node &> /dev/null; then
    # Check if node_modules exists, if not install dependencies
    if [ ! -d "node_modules" ]; then
        echo "Installing dependencies..."
        npm install
    fi
    node server.js
else
    echo "Error: Node.js is not installed!"
    echo "Install it with: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs"
    exit 1
fi

