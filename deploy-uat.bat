@echo off
REM ============================================================
REM DEPLOY TO UAT - BATCH LAUNCHER
REM ============================================================

echo ============================================================
echo DEPLOY TO UAT - Batch Launcher
echo ============================================================
echo.

REM Set working directory
cd C:\Users\theo.zwane\trailers

REM Check if PowerShell is available
where powershell >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: PowerShell not found. Please install PowerShell.
    pause
    exit /b 1
)

REM Check if the deployment script exists
if not exist "deploy-to-uat.ps1" (
    echo ERROR: deploy-to-uat.ps1 not found in current directory
    echo Current directory: %cd%
    pause
    exit /b 1
)

REM Run the deployment script
echo Running deployment script...
echo.

REM With parameters:
REM %1 = DryRun (optional)
REM %2 = Verbose (optional)

if "%1"=="-DryRun" (
    echo WARNING: Running in DRY RUN mode - no changes will be made
    echo.
    powershell -ExecutionPolicy Bypass -File "deploy-to-uat.ps1" -DryRun
) else if "%1"=="-Verbose" (
    powershell -ExecutionPolicy Bypass -File "deploy-to-uat.ps1" -Verbose
) else (
    powershell -ExecutionPolicy Bypass -File "deploy-to-uat.ps1"
)

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Deployment failed with exit code %errorlevel%
    pause
    exit /b %errorlevel%
)

echo.
echo ============================================================
echo DEPLOYMENT COMPLETE
echo ============================================================
pause