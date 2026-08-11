@echo off
REM scripts/update-project.bat
REM Windows batch file for project update

echo ========================================
echo   Project Update & Import Manager
echo ========================================

REM Check for git
where git >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Git is not installed
    exit /b 1
)

REM Check for npm
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed
    exit /b 1
)

echo [STEP] Pulling latest changes...
git pull origin main

echo [STEP] Updating dependencies...
call npm update --save

echo [STEP] Running import manager...
node scripts/manage-imports.js

echo [STEP] Installing dependencies...
call npm install

echo [STEP] Building project...
call npm run build

echo ========================================
echo Update Complete!
echo ========================================