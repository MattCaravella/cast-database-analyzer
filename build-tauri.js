const fs = require('fs');
const path = require('path');

// Ensure dist directory exists
if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist');
}

// Copy frontend files to dist
fs.copyFileSync('simple-frontend.html', 'dist/index.html');

console.log('Frontend files copied to dist directory');
console.log('Ready for Tauri build');