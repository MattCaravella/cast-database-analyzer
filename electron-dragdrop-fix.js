// ELECTRON DRAG-AND-DROP FIX
// Add these functions to your simple-frontend.html file

// Replace the existing handleFileDrop function with this one
async function handleFileDrop(files, source) {
    // Check if we're in Electron environment
    const isElectron = typeof window.require !== 'undefined';
    
    if (isElectron) {
        // Use Electron-specific file handling
        await handleElectronFileDrop(files, source);
    } else {
        // Use browser-native file handling (development mode)
        await handleBrowserFileDrop(files, source);
    }
}

// New function for Electron file handling
async function handleElectronFileDrop(files, source) {
    const filePaths = [];
    
    // Extract file paths from dropped files
    for (const file of files) {
        if (file.path) {
            // Electron provides the real file system path
            filePaths.push({
                path: file.path,
                name: file.name,
                type: file.type,
                size: file.size
            });
        }
    }
    
    if (filePaths.length === 0) {
        updateStatus('No valid files dropped');
        return;
    }
    
    if (source === 'create') {
        // First file drop on create tile - ask for tile name
        const tileName = prompt('Enter a name for this source tile:');
        if (!tileName) return;
        
        const tileId = createSourceTile(tileName);
        await processElectronFiles(filePaths, tileId);
        
        // Create new "Create Source Tile" 
        createNewCreateTile();
    } else {
        // Files dropped on existing tile
        await processElectronFiles(filePaths, source);
    }
}

// Original browser handling (for development)
async function handleBrowserFileDrop(files, source) {
    if (source === 'create') {
        const tileName = prompt('Enter a name for this source tile:');
        if (!tileName) return;
        
        const tileId = createSourceTile(tileName);
        await processFiles(files, tileId);
        
        createNewCreateTile();
    } else {
        await processFiles(files, source);
    }
}

// New function to process files using Electron IPC
async function processElectronFiles(filePaths, tileId) {
    const tile = sourceTiles.get(tileId);
    updateStatus(`Processing ${filePaths.length} files for ${tile.name}...`);
    
    for (const fileInfo of filePaths) {
        try {
            const fileName = fileInfo.name;
            const isExcel = fileName.toLowerCase().endsWith('.xlsx') || fileName.toLowerCase().endsWith('.xls');
            const isPDF = fileName.toLowerCase().endsWith('.pdf');
            
            if (fileName.toLowerCase().endsWith('.pdf')) {
                updateStatus(`📄 Extracting text from PDF: ${fileName}...`);
                console.log(`📄 Starting PDF processing for: ${fileName}`);
            } else {
                updateStatus(`Processing ${fileName}...`);
            }
            
            let text;
            
            if (isExcel || isPDF) {
                // Use binary reading for Excel and PDF files
                const result = await window.require('electron').ipcRenderer.invoke('read-dropped-file-binary', fileInfo.path);
                if (!result.success) {
                    throw new Error(result.error);
                }
                
                // Convert array back to Uint8Array
                const data = new Uint8Array(result.data);
                
                if (isExcel && typeof XLSX !== 'undefined') {
                    text = await processExcelData(data, fileName);
                } else if (isPDF) {
                    text = await processPDFData(data, fileName);
                } else {
                    throw new Error(`Unsupported file type: ${fileName}`);
                }
            } else {
                // Use text reading for other files
                const result = await window.require('electron').ipcRenderer.invoke('read-dropped-file', fileInfo.path);
                if (!result.success) {
                    throw new Error(result.error);
                }
                text = result.data;
            }
            
            const extracted = extractData(text, fileName);
            
            // Store in tile data
            tile.files.push(fileName);
            
            extracted.phones.forEach(phone => tile.phones.add(phone));
            extracted.emails.forEach(email => tile.emails.add(email));
            extracted.ips.forEach(ip => tile.ips.add(ip));
            
            // Merge phone row data
            console.log(`Merging phone data for file ${fileName} into tile ${tile.name}`);
            extracted.phoneRows.forEach((rows, phone) => {
                if (!tile.phoneRows.has(phone)) {
                    tile.phoneRows.set(phone, []);
                }
                tile.phoneRows.get(phone).push(...rows);
            });
            
            // Merge email row data
            extracted.emailRows.forEach((rows, email) => {
                if (!tile.emailRows.has(email)) {
                    tile.emailRows.set(email, []);
                }
                tile.emailRows.get(email).push(...rows);
            });
            
            // Merge IP row data
            extracted.ipRows.forEach((rows, ip) => {
                if (!tile.ipRows.has(ip)) {
                    tile.ipRows.set(ip, []);
                }
                tile.ipRows.get(ip).push(...rows);
            });
            
            // Update file display
            const fileDiv = document.createElement('div');
            fileDiv.className = 'file-list-item';
            fileDiv.innerHTML = `
                <span>${fileName}</span>
                <button class="file-remove-btn" onclick="removeFile('${tileId}', '${fileName}')" title="Remove this file">✖</button>
            `;
            document.querySelector(`#${tileId} .file-list`).appendChild(fileDiv);
            
            // Update stats counters
            const tileElement = document.getElementById(tileId);
            const fileCount = tileElement.querySelector('.file-count-link');
            const phoneCount = tileElement.querySelector('.phone-count');
            const emailCount = tileElement.querySelector('.email-count');
            const ipCount = tileElement.querySelector('.ip-count');
            fileCount.textContent = tile.files.length;
            phoneCount.textContent = tile.phones.size;
            emailCount.textContent = tile.emails.size;
            ipCount.textContent = tile.ips.size;
            
        } catch (error) {
            console.error('Error processing file:', fileInfo.name, error);
            updateStatus(`Error processing ${fileInfo.name}: ${error.message}`);
        }
    }
    
    updateAllAnalysis();
    updateStatus('Files processed successfully');
}

// Helper function to process Excel data
async function processExcelData(data, fileName) {
    const workbook = XLSX.read(data, { type: 'array' });
    console.log(`Processing Excel file with ${workbook.SheetNames.length} sheets:`, workbook.SheetNames);
    
    let allText = '';
    
    workbook.SheetNames.forEach(sheetName => {
        console.log(`Processing sheet: ${sheetName}`);
        const worksheet = workbook.Sheets[sheetName];
        
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
        console.log(`Sheet range: ${range.s.r}-${range.e.r} rows, ${range.s.c}-${range.e.c} cols`);
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1, 
            defval: '',
            raw: false
        });
        
        console.log(`Extracted ${jsonData.length} rows from sheet ${sheetName}`);
        
        jsonData.forEach((row) => {
            if (Array.isArray(row) && row.length > 0) {
                const rowText = row.map(cell => {
                    if (cell === null || cell === undefined) return '';
                    return String(cell).trim();
                }).join('\t');
                
                if (rowText.trim().length > 0) {
                    allText += rowText + '\n';
                }
            }
        });
    });
    
    console.log(`Excel parsing complete. Total text length: ${allText.length}`);
    return allText;
}

// Helper function to process PDF data
async function processPDFData(data, fileName) {
    // This would need PDF processing logic
    // For now, return empty string and add proper PDF processing later
    console.warn('PDF processing in Electron mode not yet implemented');
    return '';
}

// Enhanced setupDropZoneListeners for Electron compatibility
function setupDropZoneListenersElectron() {
    document.querySelectorAll('.drop-zone').forEach(area => {
        const source = area.dataset.source;
        
        // Remove existing listeners to avoid duplicates
        area.replaceWith(area.cloneNode(true));
        area = document.querySelector(`[data-source="${source}"]`);
        
        area.addEventListener('click', () => area.querySelector('input[type="file"]').click());
        
        area.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            area.classList.add('dragover');
        });
        
        area.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            area.classList.remove('dragover');
        });
        
        area.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            area.classList.remove('dragover');
            
            const files = Array.from(e.dataTransfer.files);
            if (files.length > 0) {
                handleFileDrop(files, source);
            }
        });
        
        // Handle file input changes (when clicking to browse)
        const input = area.querySelector('input[type="file"]');
        if (input) {
            input.addEventListener('change', (e) => {
                const files = Array.from(e.target.files);
                if (files.length > 0) {
                    handleFileDrop(files, source);
                }
                // Clear the input so the same file can be selected again
                e.target.value = '';
            });
        }
    });
}