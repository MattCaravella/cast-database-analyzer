const { contextBridge, ipcRenderer } = require('electron');

// Expose Electron APIs to the renderer process
contextBridge.exposeInMainWorld('electron', {
  // File operations
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  saveFile: (filePath, data) => ipcRenderer.invoke('save-file', filePath, data),
  readDroppedFile: (filePath) => ipcRenderer.invoke('read-dropped-file', filePath),
  getFileInfo: (filePath) => ipcRenderer.invoke('get-file-info', filePath),
  
  // Dialog operations
  showSaveDialog: (defaultName) => ipcRenderer.invoke('save-dialog', defaultName),
  showOpenDialog: () => ipcRenderer.invoke('open-dialog'),
  showMessage: (title, message, type) => ipcRenderer.invoke('show-message', title, message, type),
  
  // Drag and drop operations
  startDrag: (fileName) => ipcRenderer.send('ondragstart', fileName),
  
  // File processing
  processDroppedFiles: (files) => ipcRenderer.invoke('process-dropped-files', files),
  
  // Check if we're in Electron
  isElectron: true,
  
  // Version info
  getVersion: () => ipcRenderer.invoke('get-version')
});

// Log that preload script has loaded
console.log('Preload script loaded successfully');