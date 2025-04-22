import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as url from 'url';
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

  // Load the index.html
  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file:',
      slashes: true
    })
  );

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
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

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

// Create window when Electron has finished initialization
app.on('ready', () => {
  createWindow();
  
  // Setup IPC handlers for open-codex integration
  setupOpenCodexHandlers();
  
  // Setup IPC handlers for configuration
  setupConfigHandlers();
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
    return store.get(key);
  });

  ipcMain.handle('set-config', (event, key, value) => {
    store.set(key, value);
    return true;
  });

  // IPC handlers for API providers
  ipcMain.handle('get-api-providers', () => {
    return store.get('apiProviders');
  });

  ipcMain.handle('set-api-provider', (event, provider, apiKey) => {
    const providers = store.get('apiProviders') as Record<string, string>;
    providers[provider] = apiKey;
    store.set('apiProviders', providers);
    return true;
  });

  // IPC handlers for approval mode
  ipcMain.handle('get-approval-mode', () => {
    return store.get('approvalMode');
  });

  ipcMain.handle('set-approval-mode', (event, mode) => {
    store.set('approvalMode', mode);
    return true;
  });
}
