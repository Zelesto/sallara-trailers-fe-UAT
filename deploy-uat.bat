@echo off
setlocal
set "SCRIPT=%~dp0deploy-to-uat.ps1"

where powershell.exe >nul 2>nul
if errorlevel 1 (
    echo ERROR: Windows PowerShell was not found.
    exit /b 1
)

if not exist "%SCRIPT%" (
    echo ERROR: Deployment script not found: "%SCRIPT%"
    exit /b 1
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT%" %*
exit /b %errorlevel%