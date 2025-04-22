import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    // Configuration
    getConfig: (key: string) => ipcRenderer.invoke('get-config', key),
    setConfig: (key: string, value: any) => ipcRenderer.invoke('set-config', key, value),
    
    // API Providers
    getApiProviders: () => ipcRenderer.invoke('get-api-providers'),
    setApiProvider: (provider: string, apiKey: string) => ipcRenderer.invoke('set-api-provider', provider, apiKey),
    
    // Approval Mode
    getApprovalMode: () => ipcRenderer.invoke('get-approval-mode'),
    setApprovalMode: (mode: string) => ipcRenderer.invoke('set-approval-mode', mode),
    
    // Open-Codex Integration
    executeOpenCodex: (prompt: string, approvalMode: string) => 
      ipcRenderer.invoke('execute-open-codex', prompt, approvalMode),
    
    // File Operations
    readFile: (path: string) => ipcRenderer.invoke('read-file', path),
    writeFile: (path: string, content: string) => ipcRenderer.invoke('write-file', path, content),
    getProjectFiles: (dirPath: string) => ipcRenderer.invoke('get-project-files', dirPath),
    selectDirectory: () => ipcRenderer.invoke('select-directory'),
  }
);
