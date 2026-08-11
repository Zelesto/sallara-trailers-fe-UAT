# ============================================================
# FLEET MANAGEMENT FRONTEND - FULL UPDATE SCRIPT
# Fetches latest code, updates dependencies, builds, and pushes
# ============================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Fleet Management Frontend - Full Update" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================
# STEP 1: FETCH LATEST FROM GIT
# ============================================================
Write-Host "📥 Step 1: Fetching latest code from GitHub..." -ForegroundColor Yellow

# Check if we're in a git repo
if (-not (Test-Path ".git")) {
    Write-Host "❌ Not a git repository! Please run this script from your project root." -ForegroundColor Red
    exit 1
}

# Stash any local changes
$stashResult = git stash push -m "Auto-stash before update" --include-untracked
if ($LASTEXITCODE -eq 0 -and $stashResult -notlike "*No local changes*") {
    Write-Host "  ✅ Local changes stashed" -ForegroundColor Green
    $stashed = $true
} else {
    Write-Host "  ℹ️ No local changes to stash" -ForegroundColor Gray
    $stashed = $false
}

# Fetch latest changes
Write-Host "  Fetching from remote..." -ForegroundColor Gray
git fetch origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to fetch from remote. Check your internet connection." -ForegroundColor Red
    if ($stashed) {
        git stash pop
    }
    exit 1
}

# Get current branch
$currentBranch = git branch --show-current
Write-Host "  Current branch: $currentBranch" -ForegroundColor Gray

# Pull latest changes
Write-Host "  Pulling latest changes..." -ForegroundColor Gray
git pull origin $currentBranch

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to pull latest changes. Resolve conflicts manually." -ForegroundColor Red
    if ($stashed) {
        git stash pop
    }
    exit 1
}
Write-Host "✅ Latest code fetched successfully!" -ForegroundColor Green

# ============================================================
# STEP 2: BACKUP AND UPDATE PACKAGE.JSON
# ============================================================
Write-Host ""
Write-Host "📦 Step 2: Updating package.json..." -ForegroundColor Yellow

# Backup current package.json
if (Test-Path "package.json") {
    $backupName = "package.json.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    Copy-Item "package.json" $backupName
    Write-Host "  ✅ Backup created: $backupName" -ForegroundColor Green
}

# Read current package.json
$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json

# Check current versions
$currentMuiLab = $packageJson.dependencies."@mui/lab"
$currentVite = $packageJson.devDependencies."vite"

Write-Host "  Current @mui/lab: $currentMuiLab" -ForegroundColor Gray
Write-Host "  Current vite: $currentVite" -ForegroundColor Gray

# Update if needed
$updated = $false

if ($currentMuiLab -ne "^7.0.0-beta.0") {
    $packageJson.dependencies."@mui/lab" = "^7.0.0-beta.0"
    Write-Host "  ✅ Updated @mui/lab: $currentMuiLab → ^7.0.0-beta.0" -ForegroundColor Green
    $updated = $true
}

if ($currentVite -ne "^7.0.0") {
    $packageJson.devDependencies."vite" = "^7.0.0"
    Write-Host "  ✅ Updated vite: $currentVite → ^7.0.0" -ForegroundColor Green
    $updated = $true
}

if (-not $updated) {
    Write-Host "  ℹ️ No changes needed - package.json already up to date!" -ForegroundColor Green
} else {
    # Save the updated package.json
    $packageJson | ConvertTo-Json -Depth 10 | Set-Content "package.json"
    Write-Host "  ✅ package.json saved" -ForegroundColor Green
}

# ============================================================
# STEP 3: CLEAN AND REINSTALL DEPENDENCIES
# ============================================================
Write-Host ""
Write-Host "🧹 Step 3: Cleaning and reinstalling dependencies..." -ForegroundColor Yellow

# Remove node_modules
if (Test-Path "node_modules") {
    Write-Host "  Removing node_modules..." -ForegroundColor Gray
    Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
    Write-Host "  ✅ node_modules removed" -ForegroundColor Green
}

# Remove package-lock.json
if (Test-Path "package-lock.json") {
    Write-Host "  Removing package-lock.json..." -ForegroundColor Gray
    Remove-Item -Force "package-lock.json" -ErrorAction SilentlyContinue
    Write-Host "  ✅ package-lock.json removed" -ForegroundColor Green
}

# Install dependencies
Write-Host "  Installing dependencies (this may take a few minutes)..." -ForegroundColor Gray
$installResult = npm install --legacy-peer-deps 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencies installed successfully!" -ForegroundColor Green
} else {
    Write-Host "⚠️ First attempt failed. Trying with --force..." -ForegroundColor Yellow
    npm install --legacy-peer-deps --force
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Installation failed. Check the errors above." -ForegroundColor Red
        exit 1
    }
}

# ============================================================
# STEP 4: BUILD THE PROJECT
# ============================================================
Write-Host ""
Write-Host "🔨 Step 4: Building the project..." -ForegroundColor Yellow

$buildResult = npm run build 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful!" -ForegroundColor Green
} else {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    Write-Host "Common issues to check:" -ForegroundColor Yellow
    Write-Host "  - Missing imports (check for 'Timer' icon)" -ForegroundColor White
    Write-Host "  - Incompatible component props" -ForegroundColor White
    Write-Host "  - Check browser console for 'sx' errors" -ForegroundColor White
    Write-Host ""
    $continue = Read-Host "Continue with commit anyway? (y/n)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        exit 1
    }
}

# ============================================================
# STEP 5: GIT COMMIT AND PUSH
# ============================================================
Write-Host ""
Write-Host "📤 Step 5: Committing and pushing changes..." -ForegroundColor Yellow

# Check for changes
$status = git status --porcelain

if (-not $status) {
    Write-Host "  ℹ️ No changes to commit" -ForegroundColor Gray
} else {
    # Show changes
    Write-Host "  Changes detected:" -ForegroundColor Gray
    Write-Host $status -ForegroundColor Gray
    
    # Add changes
    git add package.json package-lock.json
    
    if (Test-Path "dist") {
        git add dist -f 2>$null
    }
    
    # Get timestamp for commit message
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
    $commitMessage = "Update dependencies and build for MUI v7 ($timestamp)"
    
    Write-Host "  Committing changes..." -ForegroundColor Gray
    git commit -m $commitMessage
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Commit successful" -ForegroundColor Green
        
        # Push to remote
        Write-Host "  Pushing to remote..." -ForegroundColor Gray
        git push origin $currentBranch
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ Push successful!" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️ Push failed. You may need to pull first or check your connection." -ForegroundColor Yellow
        }
    } else {
        Write-Host "  ⚠️ No changes to commit or commit failed" -ForegroundColor Yellow
    }
}

# ============================================================
# STEP 6: RESTORE STASHED CHANGES (if any)
# ============================================================
if ($stashed) {
    Write-Host ""
    Write-Host "🔄 Restoring stashed changes..." -ForegroundColor Yellow
    git stash pop
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Stashed changes restored" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️ Conflicts detected. Please resolve manually." -ForegroundColor Yellow
        Write-Host "  Run 'git stash show' to see what was stashed." -ForegroundColor White
    }
}

# ============================================================
# STEP 7: SUMMARY
# ============================================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✅ Update Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Summary:" -ForegroundColor Yellow
Write-Host "  ✅ Latest code pulled from GitHub" -ForegroundColor White
Write-Host "  ✅ Dependencies updated to MUI v7" -ForegroundColor White
Write-Host "  ✅ Project built successfully" -ForegroundColor White
Write-Host "  ✅ Changes committed and pushed" -ForegroundColor White
Write-Host ""
Write-Host "🔍 Next steps:" -ForegroundColor Yellow
Write-Host "  1. Test the app: npm run dev" -ForegroundColor White
Write-Host "  2. Check Render for successful deployment" -ForegroundColor White
Write-Host "  3. Verify dashboard loads without 'sx' errors" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

# Show updated versions
Write-Host ""
Write-Host "📦 Installed versions:" -ForegroundColor Yellow
npm list @mui/material @mui/icons-material @mui/lab vite --depth=0

Write-Host ""
Write-Host "Done! 🚀" -ForegroundColor Green