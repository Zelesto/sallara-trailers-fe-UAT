// scripts/update-packages.js
// Update package.json with latest versions

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('📦 Updating package.json...');

// Read package.json
const packagePath = path.join(process.cwd(), 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Define packages to update
const packages = {
    dependencies: [
        '@mui/material',
        '@mui/icons-material',
        '@mui/lab',
        '@mui/x-data-grid',
        '@mui/x-date-pickers',
        '@mui/x-charts',
        '@emotion/react',
        '@emotion/styled',
        'dayjs',
        'date-fns',
        'luxon',
        'axios',
        'react-router-dom',
        'formik',
        'yup'
    ],
    devDependencies: [
        '@vitejs/plugin-react',
        'vite',
        'eslint',
        'prettier'
    ]
};

// Update each package
Object.entries(packages).forEach(([type, pkgList]) => {
    pkgList.forEach(pkg => {
        try {
            // Get latest version
            const version = execSync(`npm show ${pkg} version`, { encoding: 'utf8' }).trim();
            if (version) {
                packageJson[type][pkg] = `^${version}`;
                console.log(`✅ Updated ${pkg} to ^${version}`);
            }
        } catch (error) {
            console.warn(`⚠️ Failed to get version for ${pkg}`);
        }
    });
});

// Write updated package.json
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
console.log('✅ package.json updated!');