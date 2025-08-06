#!/usr/bin/env python3
"""
Create a standalone Windows executable for CAST Database Analyzer
"""

import os
import sys
import subprocess
import shutil

def create_electron_executable():
    """Create executable using Electron"""
    print("Creating CAST Database Analyzer executable...")
    
    # Create electron wrapper
    electron_main = """
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    },
    icon: path.join(__dirname, 'cdr_analyzer_icon.ico'),
    title: 'CAST Database Analyzer'
  });

  mainWindow.loadFile('simple-frontend.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
"""
    
    with open('electron-simple.js', 'w') as f:
        f.write(electron_main)
    
    # Create package.json for electron-packager
    package_json = """
{
  "name": "cast-database-analyzer",
  "version": "1.0.0",
  "main": "electron-simple.js"
}
"""
    
    with open('package-simple.json', 'w') as f:
        f.write(package_json)
    
    print("Electron files created.")
    print("\nTo create the executable:")
    print("1. Install electron-packager globally: npm install -g electron-packager")
    print("2. Run: electron-packager . cast-analyzer --platform=win32 --arch=x64 --out=dist-portable --overwrite")
    
def create_python_executable():
    """Create executable using PyInstaller with embedded browser"""
    print("Creating Python-based executable...")
    
    # Create Python wrapper
    python_wrapper = '''
import sys
import os
import webview
import threading
import http.server
import socketserver
from pathlib import Path

PORT = 0  # Let system choose available port

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=os.path.dirname(os.path.abspath(__file__)), **kwargs)
    
    def log_message(self, format, *args):
        # Suppress console output
        pass

def start_server():
    global PORT
    with socketserver.TCPServer(("", 0), MyHTTPRequestHandler) as httpd:
        PORT = httpd.server_address[1]
        httpd.serve_forever()

def create_app():
    # Start local server in background
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()
    
    # Wait for server to start
    while PORT == 0:
        pass
    
    # Create window
    webview.create_window(
        'CAST Database Analyzer',
        f'http://localhost:{PORT}/simple-frontend.html',
        width=1400,
        height=900,
        min_size=(1200, 700)
    )
    webview.start()

if __name__ == '__main__':
    create_app()
'''
    
    with open('cast_analyzer.py', 'w') as f:
        f.write(python_wrapper)
    
    print("Python wrapper created.")
    print("\nTo create the executable:")
    print("1. Install PyInstaller: pip install pyinstaller pywebview")
    print("2. Run: pyinstaller --onefile --windowed --add-data 'simple-frontend.html;.' --name CAST-Analyzer cast_analyzer.py")

if __name__ == "__main__":
    print("CAST Database Analyzer - Executable Creator")
    print("=" * 50)
    
    # Check if running on Windows
    if sys.platform != 'win32':
        print("Warning: This script is designed for Windows.")
    
    # Create both options
    create_electron_executable()
    print("\n" + "=" * 50 + "\n")
    create_python_executable()
    
    print("\n" + "=" * 50)
    print("Choose your preferred method above and follow the instructions.")