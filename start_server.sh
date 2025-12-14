#!/bin/bash
# Simple bash script to start the Python server on Raspberry Pi

echo "Starting AGBAY Server..."
echo "Press Ctrl+C to stop"
echo ""

# Check if Python 3 is available
if command -v python3 &> /dev/null; then
    python3 server.py
elif command -v python &> /dev/null; then
    python server.py
else
    echo "Error: Python 3 is not installed!"
    echo "Install it with: sudo apt-get install python3"
    exit 1
fi

