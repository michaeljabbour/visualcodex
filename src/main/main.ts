import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import ElectronStore from 'electron-store';
import { setupOpenCodexHandlers } from './open-codex-bridge';

// Initialize store for app configuration
const store = new ElectronStore({
  name: 'visualcodex-config',
  defaults: {
    apiProviders: {},
    approvalMode: 'suggest',
    defaultModel: 'gpt-4o',
    windowBounds: { width: 1200, height: 800 }
  }
});

// Keep a global reference of the window object to avoid garbage collection
let mainWindow: BrowserWindow | null = null;

function createWindow() {
  // Get stored window dimensions
  const { width, height } = store.get('windowBounds') as { width: number, height: number };
  
  // Create the browser window
  mainWindow = new BrowserWindow({
    width,
    height,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false, // Don't show until ready-to-show
    title: 'VisualCodex'
  });

  // Determine the correct path to index.html
  const indexPath = path.join(__dirname, 'index.html');
  
  console.log('Loading application from:', indexPath);
  console.log('Current directory:', __dirname);
  
  // Check if the file exists
  if (!fs.existsSync(indexPath)) {
    console.error('Error: index.html not found at path:', indexPath);
    dialog.showErrorBox(
      'Application Error',
      `Could not find required file: index.html\nPath: ${indexPath}\nPlease reinstall the application.`
    );
    app.quit();
    return;
  }

  // Load the index.html
  mainWindow.loadFile(indexPath);

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    
    // Open DevTools to help with debugging
    if (process.env.NODE_ENV === 'development' || true) { // Always open for now to help debug
      mainWindow?.webContents.openDevTools();
    }
  });

  // Handle load errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
    dialog.showErrorBox(
      'Loading Error',
      `Failed to load the application: ${errorDescription} (${errorCode})`
    );
  });

  // Save window size when resized
  mainWindow.on('resize', () => {
    if (mainWindow) {
      const { width, height } = mainWindow.getBounds();
      store.set('windowBounds', { width, height });
    }
  });

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Create window when Electron has finished initialization
app.on('ready', () => {
  console.log('Application ready, creating window...');
  
  try {
    createWindow();
    
    // Setup IPC handlers for open-codex integration
    setupOpenCodexHandlers();
    
    // Setup IPC handlers for configuration
    setupConfigHandlers();
    
    console.log('Window created and handlers set up successfully');
  } catch (error) {
    console.error('Error during application startup:', error);
    dialog.showErrorBox(
      'Startup Error',
      `An error occurred during application startup: ${error}`
    );
  }
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  // On macOS applications keep their menu bar active until the user quits
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS re-create a window when dock icon is clicked and no other windows open
  if (mainWindow === null) {
    createWindow();
  }
});

// Setup IPC handlers for configuration
function setupConfigHandlers() {
  // IPC handlers for configuration
  ipcMain.handle('get-config', (event, key) => {
    console.log(`Getting config for key: ${key}`);
    return store.get(key);
  });

  ipcMain.handle('set-config', (event, key, value) => {
    console.log(`Setting config for key: ${key}`, value);
    store.set(key, value);
    return true;
  });

  // IPC handlers for API providers
  ipcMain.handle('get-api-providers', () => {
    console.log('Getting API providers');
    return store.get('apiProviders');
  });

  ipcMain.handle('set-api-provider', (event, provider, apiKey) => {
    console.log(`Setting API provider: ${provider}`);
    const providers = store.get('apiProviders') as Record<string, string>;
    providers[provider] = apiKey;
    store.set('apiProviders', providers);
    return true;
  });

  // IPC handlers for approval mode
  ipcMain.handle('get-approval-mode', () => {
    console.log('Getting approval mode');
    return store.get('approvalMode');
  });

  ipcMain.handle('set-approval-mode', (event, mode) => {
    console.log(`Setting approval mode: ${mode}`);
    store.set('approvalMode', mode);
    return true;
  });

  // Add handler for directory selection
  ipcMain.handle('select-directory', async () => {
    console.log('Opening directory selection dialog');
    if (!mainWindow) {
      return { canceled: true, directory: '' };
    }
    
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    });
    
    return {
      canceled: result.canceled,
      directory: result.filePaths.length > 0 ? result.filePaths[0] : ''
    };
  });

  // Add handlers for file operations
  ipcMain.handle('read-file', async (event, path) => {
    console.log(`Reading file: ${path}`);
    try {
      const content = await fs.promises.readFile(path, 'utf8');
      return { success: true, content };
    } catch (error) {
      console.error(`Error reading file ${path}:`, error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('write-file', async (event, path, content) => {
    console.log(`Writing file: ${path}`);
    try {
      await fs.promises.writeFile(path, content, 'utf8');
      return { success: true };
    } catch (error) {
      console.error(`Error writing file ${path}:`, error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('get-project-files', async (event, dirPath) => {
    console.log(`Getting project files from: ${dirPath}`);
    try {
      const files = await fs.promises.readdir(dirPath, { withFileTypes: true });
      const fileList = files.map(file => ({
        name: file.name,
        isDirectory: file.isDirectory(),
        path: path.join(dirPath, file.name)
      }));
      return { success: true, files: fileList };
    } catch (error) {
      console.error(`Error getting project files from ${dirPath}:`, error);
      return { success: false, error: String(error) };
    }
  });
}
