const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
      allowRunningInsecureContent: true,
      experimentalFeatures: true,
      enableRemoteModule: true
    },
    title: 'CAST Database Analyzer',
    show: false // Don't show until ready
  });

  // Load the HTML file
  mainWindow.loadFile('simple-frontend.html');

  // Show when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Remove menu bar
  mainWindow.setMenuBarVisibility(false);

  // Prevent default drag and drop behavior for the window
  mainWindow.webContents.on('dom-ready', () => {
    mainWindow.webContents.executeJavaScript(`
      // Prevent default drag behavior on document
      document.addEventListener('dragover', (e) => {
        e.preventDefault();
      });
      
      document.addEventListener('drop', (e) => {
        e.preventDefault();
      });
      
      // Re-enable drag and drop for our zones after DOM is ready
      setTimeout(() => {
        console.log('Re-initializing drag and drop...');
        const dropZones = document.querySelectorAll('.drop-zone');
        console.log('Found drop zones:', dropZones.length);
        
        dropZones.forEach((zone, index) => {
          console.log('Setting up zone', index, zone.dataset.source);
          
          // Remove existing listeners first
          zone.ondragover = null;
          zone.ondragleave = null;
          zone.ondrop = null;
          
          // Add new listeners
          zone.ondragover = (e) => {
            e.preventDefault();
            e.stopPropagation();
            zone.classList.add('dragover');
            return false;
          };
          
          zone.ondragleave = (e) => {
            e.preventDefault();
            e.stopPropagation();
            zone.classList.remove('dragover');
            return false;
          };
          
          zone.ondrop = (e) => {
            e.preventDefault();
            e.stopPropagation();
            zone.classList.remove('dragover');
            
            const files = Array.from(e.dataTransfer.files);
            const source = zone.dataset.source || 'unknown';
            
            console.log('Drop event - Files:', files.length, 'Source:', source);
            
            // Call the existing handler
            if (window.handleFileDrop) {
              window.handleFileDrop(files, source);
            }
            
            return false;
          };
        });
      }, 1000);
      
      console.log('Drag and drop handlers initialized for', dropZones.length, 'zones');
    `);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Enhanced file dialog handlers
ipcMain.handle('save-dialog', async (event, defaultName = 'database.db') => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName,
    filters: [
      { name: 'Database Files', extensions: ['db', 'json'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  return result;
});

ipcMain.handle('open-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    filters: [
      { name: 'Database Files', extensions: ['db', 'json'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    properties: ['openFile']
  });
  return result;
});

ipcMain.handle('save-file', async (event, filePath, data) => {
  try {
    fs.writeFileSync(filePath, data, 'utf8');
    return { success: true, path: filePath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return { success: true, data, path: filePath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Show message dialog
ipcMain.handle('show-message', async (event, title, message, type = 'info') => {
  const result = await dialog.showMessageBox(mainWindow, {
    type: type,
    title: title,
    message: message,
    buttons: ['OK']
  });
  return result;
});

// Read dropped file content
ipcMain.handle('read-dropped-file', async (event, filePath) => {
  try {
    const data = fs.readFileSync(filePath);
    return {
      success: true,
      data: data,
      path: filePath
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      path: filePath
    };
  }
});

// Get file info
ipcMain.handle('get-file-info', async (event, filePath) => {
  try {
    const stats = fs.statSync(filePath);
    return {
      success: true,
      name: path.basename(filePath),
      size: stats.size,
      modified: stats.mtime,
      path: filePath
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});