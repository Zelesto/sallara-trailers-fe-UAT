# update-project.ps1
# Complete project update script for Windows PowerShell

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Project Update & Import Manager     " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Step 1: Install missing packages
Write-Host "`n[STEP 1] Installing missing packages..." -ForegroundColor Yellow
npm install @mui/x-charts @mui/x-data-grid @mui/x-date-pickers @mui/lab --save

# Step 2: Create scripts folder
Write-Host "`n[STEP 2] Setting up import manager..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path ".\scripts" | Out-Null

# Step 3: Create import manager script
Write-Host "`n[STEP 3] Creating import manager..." -ForegroundColor Yellow
@"
const fs = require('fs');
const path = require('path');

const SRC_DIR = './src';

function findFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            if (!file.startsWith('node_modules') && !file.startsWith('dist') && !file.startsWith('build')) {
                findFiles(filePath, fileList);
            }
        } else if (file.match(/\\.(js|jsx|ts|tsx)$/)) {
            fileList.push(filePath);
        }
    });
    return fileList;
}

console.log('🔍 Scanning for files...');
const files = findFiles(SRC_DIR);
console.log(`Found \${files.length} files`);

let updated = 0;
files.forEach(file => {
    try {
        let content = fs.readFileSync(file, 'utf8');
        let original = content;
        const lines = content.split('\n');
        const newLines = lines.filter(line => !line.includes('@mui/x-charts'));
        content = newLines.join('\n');
        if (content !== original) {
            fs.writeFileSync(file, content, 'utf8');
            updated++;
            console.log(`✅ Updated: \${file}`);
        }
    } catch (error) {
        console.error(`❌ Error: \${file}`, error.message);
    }
});

console.log(`✅ Updated \${updated} files`);
"@ | Out-File -FilePath ".\scripts\manage-imports.js" -Encoding UTF8

# Step 4: Run import manager
Write-Host "`n[STEP 4] Running import manager..." -ForegroundColor Yellow
node scripts/manage-imports.js

# Step 5: Update muiImports.js directly
Write-Host "`n[STEP 5] Fixing muiImports.js..." -ForegroundColor Yellow
$muiImportsPath = ".\src\styles\muiImports.js"
if (Test-Path $muiImportsPath) {
    $content = Get-Content $muiImportsPath -Raw
    # Remove @mui/x-charts imports
    $content = $content -replace '(?m)^.*@mui/x-charts.*$', '// Removed: @mui/x-charts not needed'
    $content = $content -replace '(?m)^.*Chart.*from.*@mui/x-charts.*$', ''
    $content = $content -replace '(?m)^.*BarChart.*$', ''
    $content = $content -replace '(?m)^.*LineChart.*$', ''
    $content = $content -replace '(?m)^.*PieChart.*$', ''
    Set-Content -Path $muiImportsPath -Value $content
    Write-Host "✅ Fixed muiImports.js" -ForegroundColor Green
}

# Step 6: Install dependencies
Write-Host "`n[STEP 6] Installing dependencies..." -ForegroundColor Yellow
npm install

# Step 7: Build project
Write-Host "`n[STEP 7] Building project..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Build successful!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Update Complete!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ Build failed!" -ForegroundColor Red
    Write-Host "Please check the error messages above." -ForegroundColor Red
}

# Step 8: Git commit (optional)
$commit = Read-Host "`nWould you like to commit changes? (y/n)"
if ($commit -eq 'y') {
    git add .
    git commit -m "Update: Fixed imports and dependencies"
    git push origin main
    Write-Host "✅ Changes committed and pushed!" -ForegroundColor Green
}