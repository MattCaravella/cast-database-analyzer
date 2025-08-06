// Debug: Check if Tauri API is available
console.log('Window object:', window);
console.log('__TAURI__ available:', !!window.__TAURI__);

// Try to access Tauri APIs with error handling
let invoke, open, save, message;

try {
    if (window.__TAURI__) {
        console.log('Tauri API found');
        invoke = window.__TAURI__.core?.invoke;
        const dialog = window.__TAURI__.dialog;
        open = dialog?.open;
        save = dialog?.save;
        message = dialog?.message;
        console.log('API functions:', { invoke: !!invoke, open: !!open, save: !!save, message: !!message });
    } else {
        console.error('Tauri API not available - running in browser mode');
        // Fallback functions for browser testing
        invoke = async () => { console.log('invoke called but Tauri not available'); };
        open = async () => { console.log('open called but Tauri not available'); };
        save = async () => { console.log('save called but Tauri not available'); };
        message = async () => { console.log('message called but Tauri not available'); };
    }
} catch (error) {
    console.error('Error accessing Tauri API:', error);
}

let currentData = {
    source1: { files: [], records: [] },
    source2: { files: [], records: [] }
};

let extractedData = {
    phones: [],
    emails: [],
    ips: [],
    crossRef: []
};

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, setting up application...');
    setupEventListeners();
    setupDragAndDrop();
    setupTabs();
    console.log('Application setup complete');
});

function setupEventListeners() {
    document.getElementById('load-db-btn').addEventListener('click', loadDatabase);
    document.getElementById('save-db-btn').addEventListener('click', saveDatabase);
    document.getElementById('clear-btn').addEventListener('click', clearAll);
    document.getElementById('analyze-btn').addEventListener('click', analyzeCrossReference);
    
    document.querySelectorAll('.export-btn').forEach(btn => {
        btn.addEventListener('click', (e) => exportData(e.target.dataset.type));
    });
}

function setupDragAndDrop() {
    const dropZones = document.querySelectorAll('.drop-zone');
    
    dropZones.forEach(zone => {
        const fileInput = zone.querySelector('input[type="file"]');
        
        zone.addEventListener('click', () => fileInput.click());
        
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.classList.add('drag-over');
        });
        
        zone.addEventListener('dragleave', () => {
            zone.classList.remove('drag-over');
        });
        
        zone.addEventListener('drop', async (e) => {
            console.log('Drop event triggered!', e.dataTransfer.files.length, 'files');
            e.preventDefault();
            zone.classList.remove('drag-over');
            
            const files = Array.from(e.dataTransfer.files);
            const sourceId = zone.dataset.source;
            console.log('Processing', files.length, 'files for source', sourceId);
            await processFiles(files, sourceId);
        });
        
        fileInput.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files);
            const sourceId = zone.dataset.source;
            await processFiles(files, sourceId);
        });
    });
}

function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;
            
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(`${targetTab}-tab`).classList.add('active');
        });
    });
}

async function processFiles(files, sourceId) {
    console.log('processFiles called with:', files.length, 'files, sourceId:', sourceId);
    updateStatus('Processing files...');
    
    try {
        for (const file of files) {
            console.log('Processing file:', file.name, 'size:', file.size);
            updateStatus(`Processing ${file.name}...`);
            
            const reader = new FileReader();
            const fileContent = await new Promise((resolve, reject) => {
                reader.onload = (e) => {
                    console.log('File read successfully, size:', e.target.result.byteLength);
                    resolve(e.target.result);
                };
                reader.onerror = (e) => {
                    console.error('File read error:', e);
                    reject(e);
                };
                reader.readAsArrayBuffer(file);
            });
            
            console.log('Invoking process_file command...');
            const result = await invoke('process_file', {
                file_name: file.name,
                file_content: Array.from(new Uint8Array(fileContent)),
                source_id: parseInt(sourceId)
            });
            
            console.log('Backend returned:', result);
            if (!result) {
                console.error('Backend returned undefined/null result');
                throw new Error('Backend returned no result');
            }
            if (!result.fileName) {
                console.error('Backend result missing fileName:', result);
                throw new Error('Backend result missing fileName property');
            }
            updateSourceTile(sourceId, result);
        }
        
        console.log('Updating analysis...');
        await updateAnalysis();
        updateStatus('Files processed successfully');
        
    } catch (error) {
        console.error('Error in processFiles:', error);
        if (message) {
            await message(error.toString(), { title: 'Error', kind: 'error' });
        } else {
            alert('Error: ' + error.toString());
        }
        updateStatus('Error processing files');
    }
}

function updateSourceTile(sourceId, result) {
    const tile = document.getElementById(`source-tile-${sourceId}`);
    const fileCount = tile.querySelector('.file-count');
    const recordCount = tile.querySelector('.record-count');
    const fileList = tile.querySelector('.file-list');
    
    const source = sourceId === '1' ? currentData.source1 : currentData.source2;
    source.files.push(result.fileName);
    source.records.push(...result.records);
    
    fileCount.textContent = source.files.length;
    recordCount.textContent = source.records.length;
    
    const fileItem = document.createElement('div');
    fileItem.className = 'file-list-item';
    fileItem.textContent = `${result.fileName} (${result.records.length} records)`;
    fileList.appendChild(fileItem);
}

async function updateAnalysis() {
    try {
        const analysis = await invoke('get_analysis');
        extractedData = analysis;
        
        updateResultsDisplay('phones', analysis.phones);
        updateResultsDisplay('emails', analysis.emails);
        updateResultsDisplay('ips', analysis.ips);
        
    } catch (error) {
        console.error('Error updating analysis:', error);
    }
}

function updateResultsDisplay(type, data) {
    const container = document.getElementById(`${type}-results`);
    container.innerHTML = '';
    
    data.forEach(item => {
        const div = document.createElement('div');
        div.className = 'result-item';
        div.innerHTML = `
            <span>${item.value}</span>
            <span>Source ${item.source}</span>
            <span>Count: ${item.count}</span>
        `;
        container.appendChild(div);
    });
}

async function analyzeCrossReference() {
    updateStatus('Analyzing cross references...');
    
    try {
        const crossRef = await invoke('analyze_cross_reference');
        extractedData.crossRef = crossRef;
        
        const container = document.getElementById('cross-ref-results');
        container.innerHTML = '';
        
        crossRef.forEach(item => {
            const div = document.createElement('div');
            div.className = 'result-item';
            div.innerHTML = `
                <span>${item.value}</span>
                <span>Found in both sources</span>
                <span>Total: ${item.count}</span>
            `;
            container.appendChild(div);
        });
        
        updateStatus('Cross reference analysis complete');
        
    } catch (error) {
        await message(error.toString(), { title: 'Error', kind: 'error' });
        updateStatus('Error analyzing cross references');
    }
}

async function loadDatabase() {
    try {
        const selected = await open({
            multiple: false,
            filters: [{
                name: 'Database',
                extensions: ['db']
            }]
        });
        
        if (selected) {
            updateStatus('Loading database...');
            await invoke('load_database', { path: selected });
            
            const data = await invoke('get_database_info');
            currentData = data;
            
            updateUIFromDatabase();
            await updateAnalysis();
            
            updateStatus('Database loaded successfully');
        }
    } catch (error) {
        await message(error.toString(), { title: 'Error', kind: 'error' });
        updateStatus('Error loading database');
    }
}

async function saveDatabase() {
    try {
        const path = await save({
            filters: [{
                name: 'Database',
                extensions: ['db']
            }]
        });
        
        if (path) {
            updateStatus('Saving database...');
            await invoke('save_database', { path });
            updateStatus('Database saved successfully');
        }
    } catch (error) {
        await message(error.toString(), { title: 'Error', kind: 'error' });
        updateStatus('Error saving database');
    }
}

async function exportData(type) {
    try {
        const path = await save({
            filters: [{
                name: 'CSV',
                extensions: ['csv']
            }]
        });
        
        if (path) {
            updateStatus(`Exporting ${type}...`);
            await invoke('export_csv', { 
                dataType: type,
                path: path,
                data: extractedData[type] || extractedData.crossRef
            });
            updateStatus('Export complete');
        }
    } catch (error) {
        await message(error.toString(), { title: 'Error', kind: 'error' });
        updateStatus('Error exporting data');
    }
}

async function clearAll() {
    const confirmed = await message('Are you sure you want to clear all data?', {
        title: 'Confirm Clear',
        kind: 'warning'
    });
    
    if (confirmed) {
        try {
            await invoke('clear_all');
            
            currentData = {
                source1: { files: [], records: [] },
                source2: { files: [], records: [] }
            };
            
            extractedData = {
                phones: [],
                emails: [],
                ips: [],
                crossRef: []
            };
            
            document.querySelectorAll('.file-count').forEach(el => el.textContent = '0');
            document.querySelectorAll('.record-count').forEach(el => el.textContent = '0');
            document.querySelectorAll('.file-list').forEach(el => el.innerHTML = '');
            document.querySelectorAll('.results-grid').forEach(el => el.innerHTML = '');
            
            updateStatus('All data cleared');
        } catch (error) {
            await message(error.toString(), { title: 'Error', kind: 'error' });
        }
    }
}

function updateUIFromDatabase() {
    ['1', '2'].forEach(sourceId => {
        const tile = document.getElementById(`source-tile-${sourceId}`);
        const fileCount = tile.querySelector('.file-count');
        const recordCount = tile.querySelector('.record-count');
        const fileList = tile.querySelector('.file-list');
        
        const source = sourceId === '1' ? currentData.source1 : currentData.source2;
        
        fileCount.textContent = source.files.length;
        recordCount.textContent = source.records.length;
        
        fileList.innerHTML = '';
        source.files.forEach((file, idx) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-list-item';
            fileItem.textContent = file;
            fileList.appendChild(fileItem);
        });
    });
}

function updateStatus(text) {
    document.getElementById('status-text').textContent = text;
}