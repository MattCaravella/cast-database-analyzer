#!/bin/bash

# Build Linux distribution packages
echo "Building CAST Database Analyzer for Linux..."

# Install dependencies if not already installed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Build the application
echo "Building application..."
npm run dist-linux

# Check if build was successful
if [ -d "dist-electron" ]; then
    echo "Build completed successfully!"
    echo "Distribution files are in the 'dist-electron' folder:"
    ls -la dist-electron/
else
    echo "Build failed!"
    exit 1
fi