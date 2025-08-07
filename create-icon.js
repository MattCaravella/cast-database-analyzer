// Simple script to create a basic ICO file from PNG
const fs = require('fs');
const path = require('path');

// Read the PNG file
const pngPath = path.join(__dirname, 'src-tauri', 'icons', '32x32.png');
const icoPath = path.join(__dirname, 'src-tauri', 'icons', 'icon.ico');

try {
    // For now, just copy the 32x32 PNG as a basic test
    // This won't be a proper ICO but might help identify the real issue
    const pngData = fs.readFileSync(pngPath);
    
    // Create a minimal ICO header + PNG data
    // ICO format: ICONDIR header (6 bytes) + ICONDIRENTRY (16 bytes) + PNG data
    const icoHeader = Buffer.from([
        0x00, 0x00, // Reserved (must be 0)
        0x01, 0x00, // Image type (1 = ICO)
        0x01, 0x00, // Number of images
    ]);
    
    const iconDirEntry = Buffer.from([
        0x20, // Width (32 pixels)
        0x20, // Height (32 pixels) 
        0x00, // Color palette (0 = no palette)
        0x00, // Reserved (must be 0)
        0x01, 0x00, // Color planes (1)
        0x20, 0x00, // Bits per pixel (32)
        ...Buffer.from(pngData.length.toString(16).padStart(8, '0').match(/.{2}/g).reverse().map(x => parseInt(x, 16))), // Size in bytes (little-endian)
        0x16, 0x00, 0x00, 0x00 // Offset to image data (22 bytes)
    ]);
    
    const icoData = Buffer.concat([icoHeader, iconDirEntry, pngData]);
    fs.writeFileSync(icoPath, icoData);
    
    console.log('ICO file created successfully');
} catch (error) {
    console.error('Error creating ICO file:', error);
    console.log('Will skip ICO creation and use PNG only');
}