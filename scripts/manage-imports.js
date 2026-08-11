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
console.log(Found \ files);

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
            console.log(✅ Updated: \);
        }
    } catch (error) {
        console.error(❌ Error: \, error.message);
    }
});

console.log(✅ Updated \ files);
