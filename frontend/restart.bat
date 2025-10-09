@echo off
echo Cleaning up and restarting frontend...
echo.

REM Kill any node processes on port 3000 (optional)
echo Stopping any running dev servers...
taskkill /F /IM node.exe 2>nul

REM Clear cache
echo Clearing build cache...
if exist build rmdir /s /q build
if exist .cache rmdir /s /q .cache

echo.
echo Starting development server...
echo.

npm start
