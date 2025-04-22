import { ipcMain, dialog } from 'electron';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Setup handlers for open-codex integration
export function setupOpenCodexHandlers() {
  // Execute open-codex command
  ipcMain.handle('execute-open-codex', async (event, prompt: string, approvalMode: string) => {
    try {
      const result = await executeOpenCodexCommand(prompt, approvalMode);
      return result;
    } catch (error) {
      console.error('Error executing open-codex:', error);
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  });

  // Read file
  ipcMain.handle('read-file', async (event, filePath: string) => {
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
        content: '',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  });

  // Write file
  ipcMain.handle('write-file', async (event, filePath: string, content: string) => {
    try {
      await fs.promises.writeFile(filePath, content, 'utf8');
      return {
        success: true
      };
    } catch (error) {
      console.error('Error writing file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  });

  // Get project files
  ipcMain.handle('get-project-files', async (event, dirPath: string) => {
    try {
      const files = await getDirectoryContents(dirPath);
      return {
        success: true,
        files
      };
    } catch (error) {
      console.error('Error getting project files:', error);
      return {
        success: false,
        files: [],
        error: error instanceof Error ? error.message : String(error)
      };
    }
  });

  // Select directory
  ipcMain.handle('select-directory', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    
    return {
      canceled: result.canceled,
      directory: result.filePaths[0] || ''
    };
  });
}

// Execute open-codex command
async function executeOpenCodexCommand(prompt: string, approvalMode: string): Promise<{success: boolean, output: string, error?: string}> {
  return new Promise((resolve) => {
    try {
      // Get API key from config
      const apiKey = process.env.OPENAI_API_KEY || '';
      
      // Set up environment variables
      const env = {
        ...process.env,
        OPENAI_API_KEY: apiKey
      };
      
      // Set up arguments
      const args = [
        prompt,
        '--approval-mode', approvalMode
      ];
      
      // Execute open-codex
      const openCodexProcess = spawn('open-codex', args, {
        env,
        cwd: process.cwd(),
        shell: true
      });
      
      let output = '';
      let errorOutput = '';
      
      openCodexProcess.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      openCodexProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      openCodexProcess.on('close', (code) => {
        if (code === 0) {
          resolve({
            success: true,
            output
          });
        } else {
          resolve({
            success: false,
            output,
            error: errorOutput || `Process exited with code ${code}`
          });
        }
      });
    } catch (error) {
      resolve({
        success: false,
        output: '',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
}

// Get directory contents
async function getDirectoryContents(dirPath: string) {
  const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
  
  return Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(dirPath, entry.name);
    const stats = await fs.promises.stat(fullPath);
    
    return {
      name: entry.name,
      path: fullPath,
      isDirectory: entry.isDirectory(),
      size: stats.size,
      modified: stats.mtime
    };
  }));
}
