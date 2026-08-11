# ============================================================
# DEPLOY TO UAT - FORCE PUSH DEV OVER UAT
# ============================================================

$BACKUP_BRANCH_PREFIX = "backup-before-uat-deploy"
$TIMESTAMP = Get-Date -Format "yyyy-MM-dd-HHmmss"

function Write-SectionHeader {
    param($Message)
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  $Message" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Success { param($Message) ; Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
function Write-Error   { param($Message) ; Write-Host "[ERROR] $Message" -ForegroundColor Red }
function Write-Warning { param($Message) ; Write-Host "[WARNING] $Message" -ForegroundColor Yellow }
function Write-Info    { param($Message) ; Write-Host "[INFO] $Message" -ForegroundColor Gray }

function Reset-UAT-With-Dev {
    param(
        [string]$RepoPath,
        [string]$RepoName,
        [string]$DevRemoteUrl,
        [string]$UatRemoteUrl,
        [string]$BranchName
    )

    Write-SectionHeader "Processing $RepoName"

    if (!(Test-Path $RepoPath)) {
        Write-Error "Repository path not found: $RepoPath"
        return $false
    }

    Set-Location $RepoPath

    # Ensure remotes are set correctly
    git remote remove origin 2>$null
    git remote remove uat 2>$null
    git remote add origin $DevRemoteUrl
    git remote add uat $UatRemoteUrl

    git fetch --all --prune

    # Backup current UAT
    $backupBranchName = "$BACKUP_BRANCH_PREFIX-$RepoName-$TIMESTAMP"
    Write-Info "Creating backup branch: $backupBranchName"
    try {
        if (git rev-parse --verify uat/$BranchName 2>$null) {
            git checkout -b $backupBranchName uat/$BranchName
            git push uat $backupBranchName
            Write-Success "Backup created: $backupBranchName"
        } else {
            Write-Warning "No existing UAT branch found to backup"
        }
    } catch {
        Write-Error "Failed to create backup: $_"
    }

    # Push latest DEV to UAT (force overwrite)
    Write-Info "Deploying DEV branch ($BranchName) to UAT..."
    try {
        git checkout $BranchName
        git pull origin $BranchName

        $refspec = "$BranchName" + ":" + "$BranchName"
        git push uat $refspec --force

        Write-Success "UAT branch reset with latest DEV code"
        $latestCommit = git log -1 --oneline
        Write-Info "Latest DEV commit deployed: $latestCommit"
        return $true
    } catch {
        Write-Error "Deployment failed: $_"
        return $false
    }
}

# ============================================================
# MAIN EXECUTION
# ============================================================

Write-SectionHeader "DEPLOY TO UAT - RESET WITH DEV"

$gitVersion = git --version 2>$null
if (-not $gitVersion) {
    Write-Error "Git is not installed or not in PATH"
    exit 1
}

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $scriptPath) { $scriptPath = $PWD.Path }
Write-Info "Script location: $scriptPath"

# Backend
$backendPath = Join-Path $scriptPath "trailers-backend"
if (Test-Path $backendPath) {
    Reset-UAT-With-Dev $backendPath "trailers-backend" `
        "https://github.com/Zelesto/trailers-backend.git" `
        "https://github.com/Zelesto/sallara-trailers-be-UAT.git" `
        "main"
} else {
    Write-Warning "Backend not found at: $backendPath"
}

# Frontend
$frontendPath = Join-Path $scriptPath "trailers"
if (Test-Path $frontendPath) {
    Reset-UAT-With-Dev $frontendPath "trailers" `
        "https://github.com/Zelesto/trailers.git" `
        "https://github.com/Zelesto/sallara-trailers-fe-UAT.git" `
        "main"
} else {
    Write-Warning "Frontend not found at: $frontendPath"
}

Write-SectionHeader "DEPLOYMENT COMPLETE"
Write-Info "UAT branches have been reset with latest DEV code."
Write-Info "Frontend: https://github.com/Zelesto/sallara-trailers-fe-UAT"
Write-Info "Backend: https://github.com/Zelesto/sallara-trailers-be-UAT"
