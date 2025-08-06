# GitHub Deployment Guide: CAST Database Analyzer

## Step-by-Step Process to Deploy as Distributable Windows Installer

### Phase 1: Repository Setup

#### 1. Create GitHub Repository
```bash
# Option A: Create new repository on GitHub.com
# - Go to github.com
# - Click "New repository"
# - Name: "cast-database-analyzer"
# - Set as Public or Private
# - Don't initialize with README (we have files)

# Option B: Use GitHub CLI (if installed)
gh repo create cast-database-analyzer --public --source=. --remote=origin --push
```

#### 2. Initialize Git in Your Project
```bash
cd "/mnt/c/Users/CAST/Desktop/Database Analyzer"
git init
git add .
git commit -m "Initial commit: CAST Database Analyzer v1.0.0"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/cast-database-analyzer.git
git push -u origin main
```

### Phase 2: GitHub Actions Configuration

#### 3. Verify Files Are In Place
The following files should already be created:
- `.github/workflows/build-tauri.yml` ✅
- `package.json` (updated for Tauri) ✅
- `src-tauri/tauri.conf.json` ✅
- `dist/index.html` ✅
- `.gitignore` ✅

#### 4. Create a Release Tag
```bash
# Tag your current version
git tag v1.0.0
git push origin v1.0.0
```

### Phase 3: Automatic Build Process

#### 5. GitHub Actions Will Automatically:
1. **Trigger**: When you push a tag (like `v1.0.0`)
2. **Setup**: Install Rust, Node.js, and dependencies
3. **Build**: Compile the Tauri app for Windows
4. **Package**: Create `.msi` installer and `.exe` files
5. **Release**: Automatically create a GitHub Release with downloads

#### 6. Monitor Build Progress
- Go to your GitHub repo
- Click "Actions" tab
- Watch the "Build and Release CAST Database Analyzer" workflow
- Build takes ~10-15 minutes

### Phase 4: Distribution

#### 7. Download Your Installer
After successful build:
- Go to "Releases" section of your repo
- Download the `.msi` installer file
- The installer will be named something like:
  - `CAST Database Analyzer_1.0.0_x64_en-US.msi`

#### 8. Test Installation
- Run the `.msi` file on a Windows machine
- Follow the installation wizard
- Launch from Start Menu: "CAST Database Analyzer"

### Phase 5: Updates and Versioning

#### 9. For Future Updates
```bash
# Make your changes to the code
git add .
git commit -m "Update: Added new feature"

# Bump version in package.json and src-tauri/Cargo.toml
# Then create new tag
git tag v1.1.0
git push origin v1.1.0

# GitHub Actions will automatically build new release
```

### Phase 6: Manual Trigger (Optional)

#### 10. Build Without Tags
If you want to build manually:
- Go to GitHub repo → "Actions" tab
- Click "Build and Release CAST Database Analyzer"
- Click "Run workflow"
- Select branch and click "Run workflow"

### Troubleshooting

#### Common Issues:
1. **Build fails**: Check that all files are committed and pushed
2. **No artifacts**: Ensure `src-tauri/tauri.conf.json` is valid
3. **Permission errors**: Make sure repository has Actions enabled

#### Required Repository Settings:
- Go to Settings → Actions → General
- Ensure "Allow all actions and reusable workflows" is selected
- Under "Workflow permissions", select "Read and write permissions"

### Expected Output Files

After successful build, users will get:
- `CAST-Database-Analyzer_1.0.0_x64-setup.exe` (NSIS installer)
- `CAST-Database-Analyzer_1.0.0_x64_en-US.msi` (MSI installer)
- Source code archives (zip/tar.gz)

### Distribution Instructions

#### For End Users:
1. Download the `.msi` file from GitHub Releases
2. Double-click to install
3. Follow installation wizard
4. Launch from Windows Start Menu
5. No additional software needed

#### Professional Distribution:
- Host the `.msi` file on internal FBI servers
- Include checksums for verification
- Create deployment scripts for mass installation
- Set up automatic update mechanisms if needed

### Security Notes

- All builds happen on GitHub's secure infrastructure
- No secrets or sensitive data in repository
- Builds are reproducible and verifiable
- Digital signing can be added for enterprise deployment

### Next Steps After Setup

1. **Test the automatic build** by pushing a tag
2. **Download and test** the generated installer
3. **Document any custom requirements** for FBI deployment
4. **Set up additional security measures** if needed (code signing, etc.)

This process creates a professional, distributable Windows application that users can install like any other software, with automatic updates available through GitHub Releases.