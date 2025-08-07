const fs = require('fs');
const path = require('path');

// Ensure dist directory exists
if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist');
}

// Copy frontend files to dist
fs.copyFileSync('simple-frontend.html', 'dist/index.html');

// Create ICO file if it doesn't exist
const icoPath = path.join(__dirname, 'src-tauri', 'icons', 'icon.ico');
if (!fs.existsSync(icoPath)) {
    try {
        const pngPath = path.join(__dirname, 'src-tauri', 'icons', '32x32.png');
        const pngData = fs.readFileSync(pngPath);
        
        // Create a minimal ICO header + PNG data
        const icoHeader = Buffer.from([0x00, 0x00, 0x01, 0x00, 0x01, 0x00]);
        const iconDirEntry = Buffer.from([
            0x20, 0x20, 0x00, 0x00, 0x01, 0x00, 0x20, 0x00,
            ...Buffer.from(pngData.length.toString(16).padStart(8, '0').match(/.{2}/g).reverse().map(x => parseInt(x, 16))),
            0x16, 0x00, 0x00, 0x00
        ]);
        
        const icoData = Buffer.concat([icoHeader, iconDirEntry, pngData]);
        fs.writeFileSync(icoPath, icoData);
        console.log('ICO file created');
    } catch (error) {
        console.log('Warning: Could not create ICO file, using PNG fallback');
    }
}

console.log('Frontend files copied to dist directory');
console.log('Ready for Tauri build');