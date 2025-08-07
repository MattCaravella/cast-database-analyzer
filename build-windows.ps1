# Build Windows distribution packages
Write-Host "Building CAST Database Analyzer for Windows..." -ForegroundColor Green

# Install dependencies if not already installed
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Build the application
Write-Host "Building application..." -ForegroundColor Yellow
npm run dist

# Check if build was successful
if (Test-Path "dist-electron") {
    Write-Host "Build completed successfully!" -ForegroundColor Green
    Write-Host "Distribution files are in the 'dist-electron' folder" -ForegroundColor Cyan
    Get-ChildItem "dist-electron" -Name
} else {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}