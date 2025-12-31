@echo off
echo 🚀 Starting CareCircle Setup...

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Error: Node.js is not installed.
    echo Please install Node.js v18 or higher from https://nodejs.org/
    pause
    exit /b 1
)

:: Run the Node.js setup script
node scripts/setup.js
pause
