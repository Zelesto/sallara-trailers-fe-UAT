# ============================================================
# DEPLOY TO UAT - SIMPLIFIED VERSION
# ============================================================

param(
    [switch]$DryRun,
    [switch]$Verbose
)

Write-Host "DEPLOYING TO UAT" -ForegroundColor Cyan
Write-Host "================" -ForegroundColor Cyan

if ($DryRun) {
    Write-Host "DRY RUN MODE - No changes will be made" -ForegroundColor Yellow
}

# Set paths
$backendPath = "C:\Users\theo.zwane\trailers\trailers-backend"
$frontendPath = "C:\Users\theo.zwane\trailers\trailers"

# Function to deploy a repository
function Deploy-Repo {
    param($Path, $Name, $DevUrl, $UatUrl)
    
    Write-Host ""
    Write-Host "Processing $Name..." -ForegroundColor Cyan
    
    # Check if repo exists
    if (!(Test-Path $Path)) {
        Write-Host "Repository not found at $Path. Cloning..." -ForegroundColor Yellow
        git clone $DevUrl $Path
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Failed to clone repository" -ForegroundColor Red
            return $false
        }
    }
    
    Push-Location $Path
    
    Write-Host "Current branch: $(git branch --show-current)" -ForegroundColor Gray
    
    # Fetch latest
    Write-Host "Fetching latest..." -ForegroundColor Gray
    git fetch --all --prune
    
    # Create backup if UAT branch exists
    $backupBranch = "backup-before-uat-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    $uatExists = git rev-parse --verify uat/main 2>$null
    if ($uatExists) {
        Write-Host "Creating backup: $backupBranch" -ForegroundColor Gray
        git branch -D $backupBranch 2>$null
        git checkout -b $backupBranch uat/main
        git push uat $backupBranch --force 2>$null
        git checkout main 2>$null
    }
    
    # Get latest DEV
    Write-Host "Pulling latest DEV..." -ForegroundColor Gray
    git checkout main
    git pull origin main --ff-only
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Fast-forward failed, resetting..." -ForegroundColor Yellow
        git reset --hard origin/main
    }
    
    # Push to UAT
    if ($DryRun) {
        Write-Host "[DRY RUN] Would push to UAT" -ForegroundColor Yellow
    } else {
        Write-Host "Pushing to UAT..." -ForegroundColor Gray
        git push uat main --force
        if ($LASTEXITCODE -eq 0) {
            Write-Host "SUCCESS: $Name deployed successfully!" -ForegroundColor Green
        } else {
            Write-Host "FAILED: $Name deployment failed!" -ForegroundColor Red
        }
    }
    
    Pop-Location
    return $true
}

# Deploy both repos
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting deployment..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Deploy Backend
Deploy-Repo -Path $backendPath -Name "Backend" -DevUrl "https://github.com/Zelesto/trailers-backend.git" -UatUrl "https://github.com/Zelesto/sallara-trailers-be-UAT.git"

# Deploy Frontend
Deploy-Repo -Path $frontendPath -Name "Frontend" -DevUrl "https://github.com/Zelesto/trailers.git" -UatUrl "https://github.com/Zelesto/sallara-trailers-fe-UAT.git"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Repository URLs:"
Write-Host "  Backend UAT: https://github.com/Zelesto/sallara-trailers-be-UAT"
Write-Host "  Frontend UAT: https://github.com/Zelesto/sallara-trailers-fe-UAT"