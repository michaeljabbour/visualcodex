import { contextBridge, ipcRenderer } from 'electron';

// Log when preload script is executed
console.log('Preload script executing...');

try {
  // Expose protected methods that allow the renderer process to use
  // the ipcRenderer without exposing the entire object
  contextBridge.exposeInMainWorld(
    'api', {
      // Retrieve list of available models
      getModels: (): Promise<string[]> => {
        console.log('Preload: Calling getModels');
        return ipcRenderer.invoke('get-models');
      },
      // Configuration
      getConfig: (key: string) => {
        console.log(`Preload: Calling getConfig for key: ${key}`);
        return ipcRenderer.invoke('get-config', key);
      },
      setConfig: (key: string, value: any) => {
        console.log(`Preload: Calling setConfig for key: ${key}`, value);
        return ipcRenderer.invoke('set-config', key, value);
      },
      
      // API Providers
      getApiProviders: () => {
        console.log('Preload: Calling getApiProviders');
        return ipcRenderer.invoke('get-api-providers');
      },
      setApiProvider: (provider: string, apiKey: string) => {
        console.log(`Preload: Calling setApiProvider for provider: ${provider}`);
        return ipcRenderer.invoke('set-api-provider', provider, apiKey);
      },
      
      // Approval Mode
      getApprovalMode: () => {
        console.log('Preload: Calling getApprovalMode');
        return ipcRenderer.invoke('get-approval-mode');
      },
      setApprovalMode: (mode: string) => {
        console.log(`Preload: Calling setApprovalMode with mode: ${mode}`);
        return ipcRenderer.invoke('set-approval-mode', mode);
      },
      
      // Open-Codex Integration
      executeOpenCodex: (prompt: string, approvalMode: string) => {
        console.log(`Preload: Calling executeOpenCodex with approvalMode: ${approvalMode}`);
        return ipcRenderer.invoke('execute-open-codex', prompt, approvalMode);
      },
      
      // File Operations
      readFile: (path: string) => {
        console.log(`Preload: Calling readFile for path: ${path}`);
        return ipcRenderer.invoke('read-file', path);
      },
      writeFile: (path: string, content: string) => {
        console.log(`Preload: Calling writeFile for path: ${path}`);
        return ipcRenderer.invoke('write-file', path, content);
      },
      getProjectFiles: (dirPath: string) => {
        console.log(`Preload: Calling getProjectFiles for dirPath: ${dirPath}`);
        return ipcRenderer.invoke('get-project-files', dirPath);
      },
      selectDirectory: () => {
        console.log('Preload: Calling selectDirectory');
        return ipcRenderer.invoke('select-directory');
      },
    }
  );
  
  console.log('Preload script completed successfully, API exposed');
} catch (error) {
  console.error('Error in preload script:', error);
}
