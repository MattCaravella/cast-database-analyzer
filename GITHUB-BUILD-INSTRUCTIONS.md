# GitHub Build Instructions

## Step 1: Push Your Code to GitHub

### From Windows Command Prompt or PowerShell:
```bash
cd "C:\Users\CAST\Desktop\Database Analyzer"
git push origin main
```

If prompted for credentials, enter your GitHub username and personal access token.

## Step 2: Trigger a Build on GitHub

### Option A: Manual Build (Immediate)
1. Go to: https://github.com/MattCaravella/cast-database-analyzer/actions
2. Click on "Build and Release" workflow
3. Click "Run workflow" button (on the right)
4. Select "main" branch
5. Click green "Run workflow" button
6. Wait ~10-15 minutes for builds to complete
7. Download artifacts from the workflow run page

### Option B: Tagged Release (Creates GitHub Release)
```bash
# From Windows terminal:
git tag v1.4.1
git push origin v1.4.1
```

This will:
- Automatically trigger builds for Windows and Linux
- Create a GitHub Release with download links
- Upload .exe, .AppImage, and .deb files

## Step 3: Download Built Applications

### After Manual Build:
1. Go to Actions tab
2. Click on your workflow run
3. Scroll to "Artifacts" section at bottom
4. Download:
   - `windows-build` - Contains .exe installer
   - `linux-build` - Contains .AppImage and .deb

### After Tagged Release:
1. Go to Releases page: https://github.com/MattCaravella/cast-database-analyzer/releases
2. Find your release (e.g., v1.4.1)
3. Download the installer for your platform

## Build Status
You can check build status at:
https://github.com/MattCaravella/cast-database-analyzer/actions

## File Locations After Build
- **Windows installer**: `CAST Database Analyzer Setup 1.4.0.exe`
- **Linux portable**: `CAST Database Analyzer-1.4.0.AppImage`
- **Linux package**: `CAST Database Analyzer-1.4.0.deb`

## Troubleshooting

### If builds fail:
1. Check the Actions tab for error logs
2. Ensure package.json is valid
3. Verify all dependencies are listed
4. Check that electron-builder config is correct

### Common fixes:
- Missing MSI builds: Add `target: "msi"` to Windows config
- Linux build issues: May need to adjust AppImage configuration
- Large file sizes: Normal, includes Chromium engine (~150-200MB)