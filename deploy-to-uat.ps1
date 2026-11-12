# ============================================================
# DEPLOY TO UAT - SIMPLIFIED VERSION
# ============================================================

param(
    [switch]$DryRun,
    [switch]$Force,
    [switch]$Verbose
)

Write-Host "DEPLOYING TO UAT" -ForegroundColor Cyan
Write-Host "================" -ForegroundColor Cyan

if ($DryRun) {
    Write-Host "DRY RUN MODE - No changes will be made" -ForegroundColor Yellow
}
if ($Force) {
    Write-Host "FORCE MODE - UAT will be backed up before replacing its main branch" -ForegroundColor Yellow
}

# Set paths
$backendPath = Join-Path $PSScriptRoot 'trailers-backend'
$frontendPath = $PSScriptRoot

# Function to deploy a repository
function Deploy-Repo {
    param(
        [string]$Path,
        [string]$Name,
        [string]$DevUrl,
        [string]$UatUrl
    )
    
    Write-Host ""
    Write-Host "Processing $Name..." -ForegroundColor Cyan
    
    if (!(Test-Path (Join-Path $Path '.git'))) {
        Write-Error "Repository not found at $Path"
        return $false
    }
    
    Push-Location $Path
    try {
        $branch = git branch --show-current
        if ($branch -ne 'main') {
            Write-Error "$Name must be on main; current branch is '$branch'"
            return $false
        }

        $originUrl = git remote get-url origin
        $uatUrl = git remote get-url uat
        if ($originUrl -ne $DevUrl -or $uatUrl -ne $UatUrl) {
            Write-Error "$Name remotes do not match the expected source and UAT repositories"
            return $false
        }

        $changedPaths = @(git diff --name-only) + @(git diff --cached --name-only)
        $unsafeChanges = @($changedPaths | Where-Object {
            $_ -notmatch '^(dist/|trailers/?$|trailers-backend/?$)'
        })
        if ($unsafeChanges.Count -gt 0) {
            Write-Error "$Name has uncommitted source changes. Commit or resolve them before deployment."
            $unsafeChanges | ForEach-Object { Write-Host "  $_" -ForegroundColor Yellow }
            return $false
        }

        Write-Host "Fetching source and UAT branches..." -ForegroundColor Gray
        git fetch origin main
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Could not fetch origin/main for $Name"
            return $false
        }
        git fetch uat main
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Could not fetch uat/main for $Name"
            return $false
        }

        $uatCommit = git rev-parse uat/main
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Could not resolve the current UAT commit for $Name"
            return $false
        }

        if (!$Force) {
            git merge-base --is-ancestor origin/main HEAD
            if ($LASTEXITCODE -ne 0) {
                Write-Error "Local main does not contain the latest origin/main for $Name"
                return $false
            }
            git merge-base --is-ancestor uat/main HEAD
            if ($LASTEXITCODE -ne 0) {
                Write-Error "UAT has commits not present in the deployment commit for $Name; refusing a non-fast-forward deployment"
                return $false
            }
        }

        $deploymentCommit = git rev-parse --short HEAD
        if ($DryRun) {
            if ($Force) {
                $backupSuffix = [guid]::NewGuid().ToString('N').Substring(0, 6)
                $backupBranch = "backup-before-uat-$($Name.ToLowerInvariant())-$(Get-Date -Format 'yyyyMMdd-HHmmss')-$backupSuffix"
                Write-Host "[DRY RUN] Would back up UAT commit $uatCommit to $backupBranch, then replace main with $deploymentCommit" -ForegroundColor Yellow
            } else {
                Write-Host "[DRY RUN] Would deploy $deploymentCommit to $Name UAT" -ForegroundColor Yellow
            }
            return $true
        }

        if ($Force) {
            $backupSuffix = [guid]::NewGuid().ToString('N').Substring(0, 6)
            $backupBranch = "backup-before-uat-$($Name.ToLowerInvariant())-$(Get-Date -Format 'yyyyMMdd-HHmmss')-$backupSuffix"
            git push uat "uat/main:refs/heads/$backupBranch"
            if ($LASTEXITCODE -ne 0) {
                Write-Error "Could not create UAT backup branch $backupBranch for $Name"
                return $false
            }

            $lease = "--force-with-lease=refs/heads/main:$uatCommit"
            git push uat $lease "HEAD:refs/heads/main"
        } else {
            git push uat HEAD:main
        }
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Push to $Name UAT failed"
            return $false
        }

        Write-Host "SUCCESS: $Name deployed successfully!" -ForegroundColor Green
        return $true
    } finally {
        Pop-Location
    }
}

# Deploy both repos
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting deployment..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Deploy Backend
$backendDeployed = Deploy-Repo -Path $backendPath -Name "Backend" -DevUrl "https://github.com/Zelesto/trailers-backend.git" -UatUrl "https://github.com/Zelesto/sallara-trailers-be-UAT.git"

# Deploy Frontend
$frontendDeployed = Deploy-Repo -Path $frontendPath -Name "Frontend" -DevUrl "https://github.com/Zelesto/trailers.git" -UatUrl "https://github.com/Zelesto/sallara-trailers-fe-UAT.git"

Write-Host ""
if (!$backendDeployed -or !$frontendDeployed) {
    Write-Host "Deployment did not complete successfully." -ForegroundColor Red
    exit 1
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Repository URLs:"
Write-Host "  Backend UAT: https://github.com/Zelesto/sallara-trailers-be-UAT"
Write-Host "  Frontend UAT: https://github.com/Zelesto/sallara-trailers-fe-UAT"