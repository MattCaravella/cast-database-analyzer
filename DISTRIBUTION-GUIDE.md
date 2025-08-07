# CAST Database Analyzer - Distribution Guide

## Overview
Your CAST Database Analyzer is now configured for cross-platform distribution using **Electron** (not Chromely, as Electron provides better tooling and broader platform support).

## Available Distribution Formats

### Windows
- **NSIS Installer** (`.exe`) - Windows installer with setup wizard
- **MSI Package** (`.msi`) - Windows installer for enterprise deployment

### Linux  
- **AppImage** (`.AppImage`) - Portable Linux application, no installation required
- **DEB Package** (`.deb`) - Debian/Ubuntu package manager format

## Building Distributables

### Option 1: Local Builds

#### Windows (from Windows machine):
```powershell
# Run PowerShell script
.\build-windows.ps1

# Or manually:
npm install
npm run dist
```

#### Linux (from Linux/WSL):
```bash
# Run bash script  
./build-linux.sh

# Or manually:
npm install
npm run dist-linux
```

#### Cross-platform (from any system):
```bash
npm run dist-all
```

### Option 2: Automated GitHub Actions

#### Trigger Manual Build:
1. Go to your GitHub repository
2. Click "Actions" tab
3. Select "Build and Release" workflow
4. Click "Run workflow"

#### Create Release with Tagged Build:
```bash
git tag v1.4.1
git push origin v1.4.1
```
This automatically builds and creates a GitHub release with download links.

## Distribution Locations

After building, find your distributables in:
```
dist-electron/
├── CAST Database Analyzer-1.4.0.AppImage    # Linux portable
├── CAST Database Analyzer Setup 1.4.0.exe   # Windows installer  
├── CAST Database Analyzer-1.4.0.msi         # Windows MSI
└── CAST Database Analyzer-1.4.0.deb         # Linux package
```

## Why Electron Over Chromely?

While Chromely was investigated, **Electron** provides:
- ✅ **Better tooling** - electron-builder handles all platforms
- ✅ **No .NET dependency** - Works on any system with the built app
- ✅ **Mature ecosystem** - Used by VS Code, Discord, Spotify
- ✅ **Already configured** - Your project was already set up with Electron
- ✅ **GitHub Actions ready** - CI/CD pipeline included

## Installation Instructions for Users

### Windows
1. Download `.exe` installer from releases
2. Run installer and follow setup wizard
3. Launch from Start Menu or Desktop

### Linux
1. Download `.AppImage` file
2. Make executable: `chmod +x CAST*.AppImage`  
3. Run directly: `./CAST*.AppImage`

*Or install .deb package: `sudo dpkg -i CAST*.deb`*

## File Sizes (Approximate)
- Windows installer: ~150-200 MB
- Linux AppImage: ~150-200 MB  
- Linux DEB: ~150-200 MB

These sizes include the Electron runtime and Chromium engine for full web compatibility.

## Next Steps
1. Test the built applications on target platforms
2. Create your first release using `git tag v1.4.1 && git push origin v1.4.1`
3. Share download links from GitHub Releases page
4. Consider code signing for Windows (prevents security warnings)