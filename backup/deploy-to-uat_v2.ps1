# ============================================================
# DEPLOY TO UAT - FULL DEPLOYMENT SCRIPT
# ============================================================

param(
    [switch]$SkipBackup,
    [switch]$DryRun,
    [switch]$ForceUpdate,
    [string]$BackupBranchPrefix = "backup-before-uat-deploy",
    [string]$BranchName = "main"
)

$TIMESTAMP = Get-Date -Format "yyyy-MM-dd-HHmmss"

# ============================================================
# FUNCTIONS
# ============================================================

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
function Write-Step    { param($Message) ; Write-Host "  -> $Message" -ForegroundColor White }
function Write-Debug   { param($Message) ; Write-Host "[DEBUG] $Message" -ForegroundColor DarkGray }

function Test-GitRepo {
    param($Path)
    if (Test-Path (Join-Path $Path ".git")) {
        return $true
    }
    return $false
}

function Get-GitStatus {
    param($Path)
    Push-Location $Path
    $status = git status --porcelain
    Pop-Location
    return $status
}

function Update-LocalRepo {
    param(
        [string]$RepoPath,
        [string]$RepoName,
        [string]$DevRemoteUrl,
        [string]$BranchName
    )

    Write-Step "Updating local repository: $RepoName"
    
    if (!(Test-Path $RepoPath)) {
        Write-Info "Repository not found locally. Cloning..."
        git clone $DevRemoteUrl $RepoPath
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to clone repository"
            return $false
        }
        Write-Success "Repository cloned successfully"
    }

    Push-Location $RepoPath

    # Check if it's a git repo
    if (!(Test-GitRepo $RepoPath)) {
        Write-Error "Not a git repository: $RepoPath"
        Pop-Location
        return $false
    }

    # Check for uncommitted changes
    $status = Get-GitStatus $RepoPath
    if ($status -and !$ForceUpdate) {
        Write-Warning "Uncommitted changes detected in $RepoName"
        Write-Info "Changes:"
        git status --short
        if ($ForceUpdate) {
            Write-Warning "Force updating - changes will be overwritten"
        } else {
            Write-Error "Please commit or stash your changes, or use -ForceUpdate flag"
            Pop-Location
            return $false
        }
    }

    # Fetch latest
    Write-Step "Fetching latest from remote..."
    git fetch origin --prune
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to fetch from remote"
        Pop-Location
        return $false
    }

    # Checkout branch
    Write-Step "Checking out branch: $BranchName"
    git checkout $BranchName 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Step "Branch $BranchName not found locally. Creating..."
        git checkout -b $BranchName origin/$BranchName
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to checkout branch $BranchName"
            Pop-Location
            return $false
        }
    }

    # Pull latest changes
    Write-Step "Pulling latest changes..."
    git pull origin $BranchName --ff-only
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Fast-forward pull failed, attempting merge..."
        git pull origin $BranchName --no-ff
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to pull latest changes"
            Pop-Location
            return $false
        }
    }

    $latestCommit = git log -1 --oneline
    Write-Success "Local repository updated: $latestCommit"
    
    Pop-Location
    return $true
}

function Backup-UAT {
    param(
        [string]$RepoPath,
        [string]$RepoName,
        [string]$UatRemoteUrl,
        [string]$BranchName
    )

    if ($SkipBackup) {
        Write-Info "Backup skipped (--SkipBackup flag used)"
        return $true
    }

    Write-Step "Creating backup of UAT: $RepoName"
    
    Push-Location $RepoPath

    $backupBranchName = "$BackupBranchPrefix-$RepoName-$TIMESTAMP"

    try {
        # Check if UAT remote exists
        $uatExists = git ls-remote --heads $UatRemoteUrl $BranchName 2>$null
        if (-not $uatExists) {
            Write-Warning "UAT remote doesn't have branch $BranchName. Skipping backup."
            Pop-Location
            return $true
        }

        # Add UAT remote if not exists
        $currentRemotes = git remote -v | Select-String "uat"
        if (-not $currentRemotes) {
            git remote add uat $UatRemoteUrl
            Write-Info "Added UAT remote"
        }

        # Fetch UAT
        git fetch uat --prune

        # Create backup branch
        git branch -D $backupBranchName 2>$null
        git checkout -b $backupBranchName uat/$BranchName
        
        # Push backup
        git push uat $backupBranchName --force
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Backup created and pushed: $backupBranchName"
        } else {
            Write-Warning "Failed to push backup, but continuing..."
        }

        # Return to original branch
        git checkout $BranchName 2>$null

    } catch {
        Write-Error "Failed to create backup: $_"
        Write-Warning "Continuing without backup..."
    }

    Pop-Location
    return $true
}

function Deploy-To-UAT {
    param(
        [string]$RepoPath,
        [string]$RepoName,
        [string]$UatRemoteUrl,
        [string]$BranchName
    )

    if ($DryRun) {
        Write-Warning "DRY RUN MODE - No changes will be pushed"
        Write-Info "Would execute: git push uat $BranchName --force"
        return $true
    }

    Write-Step "Deploying to UAT: $RepoName"
    
    Push-Location $RepoPath

    try {
        # Ensure UAT remote exists
        $currentRemotes = git remote -v | Select-String "uat"
        if (-not $currentRemotes) {
            git remote add uat $UatRemoteUrl
            Write-Info "Added UAT remote"
        }

        # Push to UAT
        $refspec = "$BranchName" + ":" + "$BranchName"
        git push uat $refspec --force
        
        if ($LASTEXITCODE -eq 0) {
            $latestCommit = git log -1 --oneline
            Write-Success "UAT updated successfully"
            Write-Info "Deployed commit: $latestCommit"
            return $true
        } else {
            Write-Error "Failed to push to UAT"
            return $false
        }

    } catch {
        Write-Error "Deployment failed: $_"
        return $false
    }

    Pop-Location
}

function Verify-Deployment {
    param(
        [string]$RepoPath,
        [string]$RepoName,
        [string]$BranchName
    )

    Write-Step "Verifying deployment: $RepoName"
    
    Push-Location $RepoPath

    try {
        # Fetch latest from UAT
        git fetch uat --prune
        
        # Get latest commit from UAT
        $uatCommit = git log uat/$BranchName -1 --oneline
        $localCommit = git log $BranchName -1 --oneline
        
        Write-Info "UAT commit: $uatCommit"
        Write-Info "Local commit: $localCommit"
        
        if ($uatCommit -eq $localCommit) {
            Write-Success "Deployment verified successfully"
            Pop-Location
            return $true
        } else {
            Write-Warning "UAT and local commits differ"
            Pop-Location
            return $false
        }

    } catch {
        Write-Error "Verification failed: $_"
        Pop-Location
        return $false
    }
}

function Deploy-Repository {
    param(
        [string]$RepoPath,
        [string]$RepoName,
        [string]$DevRemoteUrl,
        [string]$UatRemoteUrl,
        [string]$BranchName
    )

    Write-SectionHeader "Deploying $RepoName"

    # Step 1: Update local repository
    Write-Info "Step 1/4: Updating local repository"
    if (!(Update-LocalRepo -RepoPath $RepoPath -RepoName $RepoName -DevRemoteUrl $DevRemoteUrl -BranchName $BranchName)) {
        Write-Error "Failed to update local repository"
        return $false
    }

    # Step 2: Backup UAT
    Write-Info "Step 2/4: Backing up UAT"
    if (!(Backup-UAT -RepoPath $RepoPath -RepoName $RepoName -UatRemoteUrl $UatRemoteUrl -BranchName $BranchName)) {
        Write-Warning "Backup failed, but continuing..."
    }

    # Step 3: Deploy to UAT
    Write-Info "Step 3/4: Deploying to UAT"
    if (!(Deploy-To-UAT -RepoPath $RepoPath -RepoName $RepoName -UatRemoteUrl $UatRemoteUrl -BranchName $BranchName)) {
        Write-Error "Deployment failed"
        return $false
    }

    # Step 4: Verify deployment
    Write-Info "Step 4/4: Verifying deployment"
    if (!(Verify-Deployment -RepoPath $RepoPath -RepoName $RepoName -BranchName $BranchName)) {
        Write-Warning "Verification failed, but deployment may still be successful"
    }

    Write-Success "$RepoName deployment completed successfully"
    return $true
}

# ============================================================
# MAIN EXECUTION
# ============================================================

Write-SectionHeader "DEPLOY TO UAT - FULL DEPLOYMENT"

if ($DryRun) {
    Write-Warning "RUNNING IN DRY RUN MODE - No changes will be made"
}

# Check if Git is installed
$gitVersion = git --version 2>$null
if (-not $gitVersion) {
    Write-Error "Git is not installed or not in PATH"
    Write-Info "Please install Git and try again"
    exit 1
}
Write-Info "Git version: $gitVersion"

# Get script path
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $scriptPath) { $scriptPath = $PWD.Path }
Write-Info "Script location: $scriptPath"
Write-Info "Working directory: $PWD"

# ============================================================
# Define repositories
# ============================================================
$repos = @(
    @{
        Path = Join-Path $scriptPath "trailers-backend"
        Name = "trailers-backend"
        DevUrl = "https://github.com/Zelesto/trailers-backend.git"
        UatUrl = "https://github.com/Zelesto/sallara-trailers-be-UAT.git"
        Branch = $BranchName
    },
    @{
        Path = Join-Path $scriptPath "trailers"
        Name = "trailers"
        DevUrl = "https://github.com/Zelesto/trailers.git"
        UatUrl = "https://github.com/Zelesto/sallara-trailers-fe-UAT.git"
        Branch = $BranchName
    }
)

# ============================================================
# Process each repository
# ============================================================
$results = @()

foreach ($repo in $repos) {
    Write-SectionHeader "Processing $($repo.Name)"
    
    $result = Deploy-Repository `
        -RepoPath $repo.Path `
        -RepoName $repo.Name `
        -DevRemoteUrl $repo.DevUrl `
        -UatRemoteUrl $repo.UatUrl `
        -BranchName $repo.Branch
    
    $results += @{
        Name = $repo.Name
        Success = $result
    }
}

# ============================================================
# Summary
# ============================================================
Write-SectionHeader "DEPLOYMENT SUMMARY"

$successCount = ($results | Where-Object { $_.Success }).Count
$failureCount = $results.Count - $successCount

Write-Host ""
Write-Host "DEPLOYMENT RESULTS" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan
Write-Host ""

foreach ($result in $results) {
    $status = if ($result.Success) { "SUCCESS" } else { "FAILED" }
    $color = if ($result.Success) { "Green" } else { "Red" }
    Write-Host "  $($result.Name): $status" -ForegroundColor $color
}

Write-Host ""
Write-Host "Total: $($results.Count) repositories"
Write-Host "  Successful: $successCount" -ForegroundColor Green
Write-Host "  Failed: $failureCount" -ForegroundColor Red
Write-Host ""

if ($successCount -gt 0) {
    Write-Info "UAT branches have been reset with latest DEV code."
    Write-Host ""
    Write-Info "Repository URLs:"
    Write-Info "  Backend: https://github.com/Zelesto/sallara-trailers-be-UAT"
    Write-Info "  Frontend: https://github.com/Zelesto/sallara-trailers-fe-UAT"
    Write-Host ""
    
    if (-not $SkipBackup) {
        Write-Info "Backup branches created (if any):"
        foreach ($repo in $repos) {
            Push-Location $repo.Path 2>$null
            $backups = git branch -r | Select-String "$BackupBranchPrefix-$($repo.Name)-" | ForEach-Object { $_.ToString().Trim() }
            if ($backups) {
                Write-Info "  $($repo.Name):"
                foreach ($backup in $backups) {
                    Write-Info "    $backup"
                }
            }
            Pop-Location 2>$null
        }
    }
}

if ($failureCount -gt 0) {
    Write-Error "One or more deployments failed. Please check the errors above."
    Write-Host ""
    Write-Info "Troubleshooting tips:"
    Write-Info "  1. Check your network connection"
    Write-Info "  2. Verify you have push access to the UAT repositories"
    Write-Info "  3. Check if the UAT branch exists"
    Write-Info "  4. Try running with -DryRun flag to preview changes"
    Write-Info "  5. Try running with -ForceUpdate to overwrite local changes"
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Cyan
Write-Host ""
Write-Info "Deployment timestamp: $TIMESTAMP"