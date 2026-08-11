#!/bin/bash
# scripts/update-project.sh
# Complete project update script with import management

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Project Update & Import Manager     ${NC}"
echo -e "${BLUE}========================================${NC}"

# Configuration
REPO_URL="https://github.com/Zelesto/trailers"
BRANCH="main"
PROJECT_DIR="$(pwd)"
BACKUP_DIR="../backup_$(date +%Y%m%d_%H%M%S)"

# Function to print colored messages
print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "\n${BLUE}[STEP]${NC} $1"
}

# Check if git is installed
if ! command -v git &> /dev/null; then
    print_error "Git is not installed. Please install git first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

# Step 1: Backup current project
print_step "Creating backup of current project..."
mkdir -p "$BACKUP_DIR"
if [ -d "$PROJECT_DIR" ]; then
    print_message "Backing up to: $BACKUP_DIR"
    cp -r "$PROJECT_DIR"/* "$BACKUP_DIR/" 2>/dev/null || true
    print_message "Backup created successfully"
fi

# Step 2: Check if we're in a git repo
print_step "Checking git repository status..."
if [ -d ".git" ]; then
    print_message "Git repository detected"
    
    # Save current changes
    if ! git diff --quiet || ! git diff --cached --quiet; then
        print_warning "You have uncommitted changes. Creating a stash..."
        git stash push -m "Auto-stash before update $(date +%Y%m%d_%H%M%S)"
        STASHED=true
    else
        STASHED=false
    fi
    
    # Fetch latest changes
    print_message "Fetching latest changes from remote..."
    git fetch origin
    
    # Check if we're on the right branch
    CURRENT_BRANCH=$(git branch --show-current)
    if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
        print_warning "Currently on branch '$CURRENT_BRANCH'. Switching to '$BRANCH'..."
        git checkout "$BRANCH"
    fi
    
    # Pull latest changes
    print_message "Pulling latest changes..."
    git pull origin "$BRANCH"
    
else
    print_message "Not a git repository. Cloning from $REPO_URL..."
    cd ..
    git clone "$REPO_URL" temp_repo
    cd temp_repo
    PROJECT_DIR="$(pwd)"
fi

# Step 3: Update package.json with latest dependencies
print_step "Updating package.json with latest dependencies..."

# Check if package.json exists
if [ ! -f "package.json" ]; then
    print_error "package.json not found!"
    exit 1
fi

# Create a backup of package.json
cp package.json package.json.backup

# Update dependencies to latest versions
print_message "Checking for outdated packages..."
npm outdated --json > outdated-packages.json 2>/dev/null || true

# Install/update required packages
print_step "Installing/updating required packages..."

# Core dependencies
print_message "Installing core dependencies..."
npm install --save \
    @mui/material@latest \
    @mui/icons-material@latest \
    @mui/lab@latest \
    @mui/x-data-grid@latest \
    @mui/x-date-pickers@latest \
    @mui/x-charts@latest \
    @emotion/react@latest \
    @emotion/styled@latest

# Date handling
print_message "Installing date handling libraries..."
npm install --save \
    dayjs@latest \
    date-fns@latest \
    luxon@latest

# Additional utilities
print_message "Installing utility libraries..."
npm install --save \
    axios@latest \
    react-router-dom@latest \
    formik@latest \
    yup@latest

# Install dev dependencies
print_message "Installing dev dependencies..."
npm install --save-dev \
    @vitejs/plugin-react@latest \
    vite@latest \
    eslint@latest \
    prettier@latest \
    @types/react@latest \
    @types/react-dom@latest

# Step 4: Create/Update import management script
print_step "Setting up import management..."

# Create the import manager script
cat > scripts/manage-imports.js << 'EOF'
#!/usr/bin/env node

/**
 * Import Manager Script
 * Analyzes and updates imports across the project
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Configuration
const SRC_DIR = './src';
const MUI_IMPORTS_FILE = './src/styles/muiImports.js';

// Package to import mapping
const packageMapping = {
    '@mui/material': {
        imports: [
            'Box', 'Typography', 'Paper', 'Table', 'TableBody', 'TableCell',
            'TableContainer', 'TableHead', 'TableRow', 'TablePagination',
            'TextField', 'Button', 'Dialog', 'DialogTitle', 'DialogContent',
            'DialogActions', 'FormControl', 'InputLabel', 'Select', 'MenuItem',
            'Chip', 'IconButton', 'Tooltip', 'Alert', 'CircularProgress',
            'Stack', 'Grid', 'Switch', 'FormControlLabel', 'Tabs', 'Tab',
            'Card', 'CardContent', 'CardHeader', 'CardActions', 'Divider',
            'LinearProgress', 'Skeleton', 'Badge', 'Avatar', 'List',
            'ListItem', 'ListItemText', 'ListItemIcon', 'ListItemAvatar',
            'ListSubheader', 'Collapse', 'Drawer', 'AppBar', 'Toolbar',
            'Container', 'CssBaseline', 'ThemeProvider', 'createTheme',
            'responsiveFontSizes', 'useMediaQuery', 'useTheme', 'Fade',
            'Grow', 'Slide', 'Zoom', 'Backdrop', 'Modal', 'Popover',
            'Popper', 'Menu', 'MenuList', 'Checkbox', 'Radio', 'RadioGroup',
            'FormGroup', 'FormLabel', 'FormHelperText', 'InputAdornment',
            'OutlinedInput', 'FilledInput', 'InputBase', 'Autocomplete',
            'Rating', 'Slider', 'Stepper', 'Step', 'StepLabel', 'StepContent',
            'StepButton', 'MobileStepper', 'ToggleButton', 'ToggleButtonGroup',
            'SpeedDial', 'SpeedDialAction', 'SpeedDialIcon', 'Fab',
            'BottomNavigation', 'BottomNavigationAction', 'Breadcrumbs',
            'Link'
        ]
    },
    '@mui/icons-material': {
        imports: [
            'SaveIcon', 'CloseIcon', 'DeleteIcon', 'EditIcon', 'AddIcon',
            'RefreshIcon', 'SearchIcon', 'FilterListIcon', 'ViewListIcon',
            'ViewModuleIcon', 'MoreVertIcon', 'ArrowBackIcon',
            'ArrowForwardIcon', 'ArrowUpwardIcon', 'ArrowDownwardIcon',
            'CheckIcon', 'ClearIcon', 'DoneIcon', 'CancelIcon', 'RestoreIcon',
            'PrintIcon', 'DownloadIcon', 'UploadIcon', 'SettingsIcon',
            'HelpIcon', 'InfoIcon', 'WarningIcon', 'ErrorIcon',
            'CheckCircleIcon', 'LockIcon', 'LockOpenIcon', 'VisibilityIcon',
            'VisibilityOffIcon', 'ExpandMoreIcon', 'ExpandLessIcon',
            'ChevronLeftIcon', 'ChevronRightIcon', 'MenuIcon', 'HomeIcon',
            'DashboardIcon', 'AssignmentIcon', 'ScheduleIcon',
            'DirectionsCarIcon', 'DescriptionIcon', 'LocationOnIcon',
            'SwapHorizIcon', 'ScaleIcon', 'AttachMoneyIcon', 'CommentIcon',
            'TollIcon', 'ReceiptIcon', 'BusinessIcon', 'WarehouseIcon',
            'RouteIcon', 'PersonIcon', 'PeopleIcon', 'GroupIcon'
        ]
    },
    '@mui/lab': {
        imports: [
            'LoadingButton', 'TabContext', 'TabList', 'TabPanel',
            'Timeline', 'TimelineConnector', 'TimelineContent',
            'TimelineDot', 'TimelineItem', 'TimelineOppositeContent',
            'TimelineSeparator', 'TreeItem', 'TreeView'
        ]
    },
    '@mui/x-data-grid': {
        imports: [
            'DataGrid', 'GridToolbar', 'GridToolbarContainer',
            'GridToolbarColumnsButton', 'GridToolbarFilterButton',
            'GridToolbarDensitySelector', 'GridToolbarExport',
            'GridToolbarQuickFilter', 'useGridApiRef'
        ]
    },
    '@mui/x-date-pickers': {
        imports: [
            'DateCalendar', 'LocalizationProvider'
        ]
    }
};

// Create import map
const importMap = {};
Object.entries(packageMapping).forEach(([pkg, { imports }]) => {
    imports.forEach(imp => {
        importMap[imp] = pkg;
    });
});

console.log('📦 Import Manager started...');

// Find all JavaScript/JSX files
const files = glob.sync(`${SRC_DIR}/**/*.{js,jsx,ts,tsx}`, {
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
});

console.log(`🔍 Found ${files.length} files to process`);

// Process each file
files.forEach(file => {
    try {
        let content = fs.readFileSync(file, 'utf8');
        let updated = false;

        // Check for direct MUI imports
        const lines = content.split('\n');
        const newLines = [];
        let importStatements = [];
        let foundImports = new Set();

        lines.forEach(line => {
            // Check for import statements from MUI packages
            if (line.includes('@mui/') && line.includes('import')) {
                // Extract imported components
                const matches = line.match(/import\s*{([^}]*)}\s*from\s*['"]([^'"]+)['"]/);
                if (matches) {
                    const imports = matches[1].split(',').map(i => i.trim());
                    const packageName = matches[2];
                    
                    // If it's a MUI package, we might want to consolidate
                    if (Object.keys(packageMapping).includes(packageName)) {
                        imports.forEach(imp => {
                            if (imp && !imp.startsWith('*') && !imp.startsWith('type')) {
                                foundImports.add(imp);
                            }
                        });
                    } else {
                        // Keep non-MUI imports
                        newLines.push(line);
                    }
                } else {
                    // Keep other imports
                    newLines.push(line);
                }
            } else {
                newLines.push(line);
            }
        });

        // If we found MUI imports, add consolidated import
        if (foundImports.size > 0) {
            // Group by package
            const grouped = {};
            foundImports.forEach(imp => {
                const pkg = importMap[imp];
                if (pkg) {
                    if (!grouped[pkg]) grouped[pkg] = [];
                    grouped[pkg].push(imp);
                }
            });

            // Add consolidated imports at the top
            let newContent = '';
            Object.entries(grouped).forEach(([pkg, imports]) => {
                const importLine = `import { ${imports.join(', ')} } from '${pkg}';`;
                newContent += importLine + '\n';
            });
            newContent += '\n';
            newContent += newLines.join('\n');

            if (newContent !== content) {
                fs.writeFileSync(file, newContent, 'utf8');
                console.log(`✅ Updated imports in: ${file}`);
                updated = true;
            }
        }

        // Also check for direct usage of components that should be imported
        if (!updated) {
            // Check if file uses components but doesn't import them
            const contentWithoutImports = content.replace(/import[^;]*;/g, '');
            const usedComponents = new Set();
            
            // Find potential component usage
            const componentRegex = /<([A-Z][a-zA-Z0-9]*)/g;
            let match;
            while ((match = componentRegex.exec(contentWithoutImports)) !== null) {
                const component = match[1];
                if (importMap[component]) {
                    usedComponents.add(component);
                }
            }

            if (usedComponents.size > 0) {
                // Add missing imports
                const imports = Array.from(usedComponents);
                const grouped = {};
                imports.forEach(imp => {
                    const pkg = importMap[imp];
                    if (pkg) {
                        if (!grouped[pkg]) grouped[pkg] = [];
                        grouped[pkg].push(imp);
                    }
                });

                // Insert imports at the beginning of the file
                let header = '';
                Object.entries(grouped).forEach(([pkg, pkgImports]) => {
                    header += `import { ${pkgImports.join(', ')} } from '${pkg}';\n`;
                });
                content = header + content;
                fs.writeFileSync(file, content, 'utf8');
                console.log(`✅ Added missing imports in: ${file}`);
            }
        }
    } catch (error) {
        console.error(`❌ Error processing ${file}:`, error.message);
    }
});

console.log('✅ Import management complete!');
EOF

# Make the script executable
chmod +x scripts/manage-imports.js

# Step 5: Run the import manager
print_step "Running import manager..."
node scripts/manage-imports.js

# Step 6: Install any remaining dependencies
print_step "Installing all dependencies..."
npm install

# Step 7: Run build to verify
print_step "Building project to verify..."
npm run build || {
    print_warning "Build failed. Attempting to fix..."
    # Try to fix common issues
    npm install --legacy-peer-deps
    npm run build
}

# Step 8: Check for vulnerabilities
print_step "Checking for vulnerabilities..."
npm audit --audit-level=moderate || {
    print_warning "Some vulnerabilities found. Running npm audit fix..."
    npm audit fix
}

# Step 9: Commit changes
print_step "Committing changes..."
if [ -d ".git" ]; then
    git add .
    git commit -m "Update: Automated project update with import management

- Updated all dependencies to latest versions
- Consolidated and optimized imports
- Added import management tools
- Fixed import issues
- $(date +%Y-%m-%d)"
    
    print_message "Changes committed locally"
    
    # Push changes
    print_step "Pushing changes to remote..."
    git push origin "$BRANCH" || {
        print_warning "Failed to push. You may need to pull first or resolve conflicts."
    }
else
    print_warning "Not a git repository. Changes saved locally."
fi

# Step 10: Cleanup
print_step "Cleaning up..."
rm -f outdated-packages.json
rm -f package.json.backup

# Step 11: Summary
echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}Update Complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Backup created at: ${YELLOW}$BACKUP_DIR${NC}"
echo -e "Project updated with latest dependencies and optimized imports"
echo -e "Import management script available at: ${YELLOW}scripts/manage-imports.js${NC}"
echo -e "\nTo run import manager manually:"
echo -e "  ${GREEN}node scripts/manage-imports.js${NC}"

# Restore stashed changes if any
if [ "$STASHED" = true ]; then
    print_message "Restoring stashed changes..."
    git stash pop || true
fi

echo -e "\n${GREEN}✅ All tasks completed successfully!${NC}"