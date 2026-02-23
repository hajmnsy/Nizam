@echo off
echo ==========================================
echo    Steel Warehouse System Setup
echo ==========================================
echo.

cd /d "%~dp0"

echo [1/3] Installing dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Failed to install dependencies. Please check your internet connection.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/3] Setting up database...
call npx prisma migrate dev --name init
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Failed to setup database.
    pause
    exit /b %ERRORLEVEL%
)
call node prisma/seed.js

echo.
echo [3/3] Starting application...
echo.
echo The application will be available at http://localhost:3000
echo.
call npm run dev
pause
