@echo off
REM Simple batch script to start the Python server on Windows
REM (Useful for testing before deploying to Raspberry Pi)

echo Starting AGBAY Server...
echo Press Ctrl+C to stop
echo.

python server.py

if errorlevel 1 (
    echo.
    echo Error: Python is not installed or not in PATH!
    echo Install Python 3 from https://www.python.org/
    pause
)

