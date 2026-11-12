# ============================================================
# DEPLOY TO UAT - SIMPLIFIED VERSION
# ============================================================

param(
    [switch]$DryRun,
    [switch]$Verbose,
    [switch]$Force
)

$ErrorActionPreference = "Stop"

$backendPath = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..\..\trailers-backend-main\trailers-backend-main"))
$repositories = @(
    @{
        Name = "Backend"
        Path = $backendPath
        UatUrl = "https://github.com/Zelesto/sallara-trailers-be-UAT.git"
    },
    @{
        Name = "Frontend"
        Path = $PSScriptRoot
        UatUrl = "https://github.com/Zelesto/sallara-trailers-fe-UAT.git"
    }
)

if ($DryRun) {
    Write-Host "DRY RUN - no backup branches or pushes will be created." -ForegroundColor Yellow
}

if ($Force) {
    Write-Host "Force-with-lease enabled; each existing UAT main will be backed up first." -ForegroundColor Yellow
}

foreach ($repository in $repositories) {
    if (-not (Test-Path $repository.Path)) {
        throw "$($repository.Name) repository was not found at $($repository.Path)."
    }

    Push-Location $repository.Path
    try {
        $branch = git branch --show-current
        if ($LASTEXITCODE -ne 0 -or $branch -ne "main") {
            throw "$($repository.Name) must be checked out on main before deployment."
        }

        $changes = git status --porcelain
        if ($LASTEXITCODE -ne 0) {
            throw "Could not inspect $($repository.Name) worktree."
        }
        if ($changes) {
            throw "$($repository.Name) has uncommitted changes; commit or stash them before deployment."
        }

        $head = git rev-parse HEAD
        if ($LASTEXITCODE -ne 0) {
            throw "Could not resolve $($repository.Name) HEAD."
        }

        $remoteMain = git ls-remote --heads $repository.UatUrl refs/heads/main
        if ($LASTEXITCODE -ne 0) {
            throw "Could not read the $($repository.Name) UAT main branch."
        }
        $remoteHead = $null
        if ($remoteMain) {
            $remoteHead = ($remoteMain -split "\s+")[0]
        }

        Write-Host "$($repository.Name): $head -> $($repository.UatUrl) (main)"
        if ($DryRun) {
            continue
        }

        if ($remoteHead) {
            git fetch --no-tags $repository.UatUrl refs/heads/main
            if ($LASTEXITCODE -ne 0) {
                throw "Could not fetch the $($repository.Name) UAT main branch."
            }
            $fetchedHead = git rev-parse FETCH_HEAD
            if ($LASTEXITCODE -ne 0 -or $fetchedHead -ne $remoteHead) {
                throw "$($repository.Name) UAT main changed during deployment; retry after reviewing the new head."
            }
        }

        if ($Force -and $remoteHead) {
            $backupBranch = "backup-before-uat-redeploy-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
            git push $repository.UatUrl "${remoteHead}:refs/heads/$backupBranch"
            if ($LASTEXITCODE -ne 0) {
                throw "Could not create the $($repository.Name) UAT backup branch."
            }
            git push "--force-with-lease=refs/heads/main:$remoteHead" $repository.UatUrl "${head}:refs/heads/main"
        } else {
            git push $repository.UatUrl "${head}:refs/heads/main"
        }
        if ($LASTEXITCODE -ne 0) {
            throw "$($repository.Name) UAT push failed."
        }

        $deployedHead = git ls-remote --heads $repository.UatUrl refs/heads/main
        if ($LASTEXITCODE -ne 0 -or ($deployedHead -split "\s+")[0] -ne $head) {
            throw "$($repository.Name) UAT main did not resolve to the requested commit."
        }
        Write-Host "$($repository.Name) UAT main updated successfully." -ForegroundColor Green
    } finally {
        Pop-Location
    }
}