import { ipcMain } from 'electron';
import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';

// Function to execute a command through open-codex
export async function executeCommand(command, cwd, approvalMode) {
  return new Promise((resolve, reject) => {
    // Get API key from environment or config
    const apiKey = process.env.OPENAI_API_KEY || '';
    
    if (!apiKey) {
      reject(new Error('API key not found. Please set it in the settings.'));
      return;
    }

    // Prepare environment variables
    const env = {
      ...process.env,
      OPENAI_API_KEY: apiKey
    };

    // Prepare command arguments
    const args = [];
    
    if (approvalMode) {
      args.push('--approval-mode', approvalMode);
    }
    
    args.push(command);

    // Spawn open-codex process
    const openCodexProcess = spawn('open-codex', args, {
      env,
      cwd,
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

// Setup IPC handlers for renderer process
export function setupOpenCodexHandlers() {
  // Execute command
  ipcMain.handle('execute-command', async (event, command, cwd, approvalMode) => {
    try {
      const result = await executeCommand(command, cwd, approvalMode);
      return result;
    } catch (error) {
      console.error('Error executing command:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });

  // Read file
  ipcMain.handle('read-file', async (event, filePath) => {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return {
        success: true,
        content
      };
    } catch (error) {
      console.error('Error reading file:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });

  // Write file
  ipcMain.handle('write-file', async (event, filePath, content) => {
    try {
      await fs.writeFile(filePath, content, 'utf8');
      return {
        success: true
      };
    } catch (error) {
      console.error('Error writing file:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });

  // Get project files
  ipcMain.handle('get-project-files', async (event, dirPath) => {
    try {
      const files = await fs.readdir(dirPath, { withFileTypes: true });
      const fileList = await Promise.all(
        files.map(async (file) => {
          const filePath = path.join(dirPath, file.name);
          const stats = await fs.stat(filePath);
          return {
            name: file.name,
            path: filePath,
            isDirectory: file.isDirectory(),
            size: stats.size,
            modified: stats.mtime
          };
        })
      );
      return {
        success: true,
        files: fileList
      };
    } catch (error) {
      console.error('Error getting project files:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });
}
