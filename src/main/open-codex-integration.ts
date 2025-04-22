import { ipcMain, dialog } from 'electron';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import ElectronStore from 'electron-store';

// Initialize store for app configuration
const store = new ElectronStore({
  name: 'visualcodex-config'
});

// Setup IPC handlers for open-codex integration
export function setupOpenCodexIntegration() {
  // Handler for executing commands through open-codex
  ipcMain.handle('execute-open-codex', async (event, prompt, approvalMode) => {
    try {
      const result = await executeOpenCodex(prompt, approvalMode);
      return result;
    } catch (error) {
      console.error('Error executing open-codex:', error);
      return {
        success: false,
        output: `Error: ${error.message || 'Unknown error occurred'}`
      };
    }
  });

  // Handler for reading files
  ipcMain.handle('read-file', async (event, filePath) => {
    try {
      const content = await fs.promises.readFile(filePath, 'utf8');
      return {
        success: true,
        content
      };
    } catch (error) {
      console.error('Error reading file:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      };
    }
  });

  // Handler for writing files
  ipcMain.handle('write-file', async (event, filePath, content) => {
    try {
      await fs.promises.writeFile(filePath, content, 'utf8');
      return {
        success: true
      };
    } catch (error) {
      console.error('Error writing file:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      };
    }
  });

  // Handler for selecting directory
  ipcMain.handle('select-directory', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    
    if (result.canceled) {
      return { canceled: true };
    }
    
    return {
      canceled: false,
      directory: result.filePaths[0]
    };
  });
}

// Function to execute open-codex CLI with the given prompt and approval mode
async function executeOpenCodex(prompt, approvalMode) {
  return new Promise((resolve, reject) => {
    // Get API key from store
    const apiProviders = store.get('apiProviders') || {};
    const openaiApiKey = apiProviders['OpenAI'];
    
    if (!openaiApiKey) {
      reject(new Error('OpenAI API key not found. Please add it in Settings.'));
      return;
    }

    // Prepare environment variables
    const env = {
      ...process.env,
      OPENAI_API_KEY: openaiApiKey
    };

    // Prepare command arguments
    const args = [];
    
    if (approvalMode) {
      args.push('--approval-mode', approvalMode);
    }
    
    if (prompt) {
      args.push(prompt);
    }

    // Spawn open-codex process
    const openCodexProcess = spawn('open-codex', args, {
      env,
      cwd: process.cwd(),
      shell: true
    });

    let stdout = '';
    let stderr = '';

    openCodexProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    openCodexProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    openCodexProcess.on('close', (code) => {
      if (code === 0) {
        resolve({
          success: true,
          output: stdout,
          exitCode: code
        });
      } else {
        resolve({
          success: false,
          output: stdout,
          error: stderr,
          exitCode: code
        });
      }
    });

    openCodexProcess.on('error', (error) => {
      reject(error);
    });
  });
}
