@echo off
REM Simple batch script to start the Node.js server on Windows
REM (Useful for testing before deploying to Raspberry Pi)

echo Starting AGBAY Server...
echo Press Ctrl+C to stop
echo.

REM Check if node_modules exists, if not install dependencies
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

node server.js

if errorlevel 1 (
    echo.
    echo Error: Node.js is not installed or not in PATH!
    echo Install Node.js from https://nodejs.org/
    pause
)

