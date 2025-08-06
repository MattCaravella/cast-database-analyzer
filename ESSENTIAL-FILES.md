# Essential Files for GitHub Repository

## Required for Tauri Build:

### Root Directory:
- `package.json` - Node.js dependencies and scripts
- `Cargo.toml` - Workspace configuration  
- `simple-frontend.html` - Main application (copy to index.html for build)
- `dist/index.html` - Frontend entry point

### src-tauri/ Directory:
- `src-tauri/Cargo.toml` - Rust dependencies
- `src-tauri/tauri.conf.json` - Tauri configuration
- `src-tauri/src/main.rs` - Rust backend code
- `src-tauri/build.rs` - Build script
- `src-tauri/icons/` - Application icons

### GitHub Actions:
- `.github/workflows/build-tauri.yml` - Automated build

### Documentation:
- `README.md` - Project documentation
- `.gitignore` - File exclusions

## Files Excluded (too large):
- `node_modules/` - Downloaded during build
- `src-tauri/target/` - Compiled artifacts  
- `*.exe`, `*.msi` - Generated installers
- `*.db` - Example databases
- `*.bat` - Local scripts