// Type definitions for the Electron API exposed through preload script
export interface ElectronAPI {
  // Configuration
  getConfig: (key: string) => Promise<any>;
  setConfig: (key: string, value: any) => Promise<boolean>;
  
  // API Providers
  getApiProviders: () => Promise<Record<string, string>>;
  setApiProvider: (provider: string, apiKey: string) => Promise<boolean>;
  
  // Approval Mode
  getApprovalMode: () => Promise<string>;
  setApprovalMode: (mode: string) => Promise<boolean>;
  
  // Future: Command execution, file operations, etc.
  executeCommand: (command: string) => Promise<any>;
  readFile: (path: string) => Promise<string>;
  writeFile: (path: string, content: string) => Promise<boolean>;
}

// Extend Window interface to include our API
declare global {
  interface Window {
    api: ElectronAPI;
  }
}

// Approval mode types
export type ApprovalMode = 'suggest' | 'auto-edit' | 'full-auto';

// AI Provider types
export type AIProvider = 'openai' | 'gemini' | 'openrouter' | 'ollama' | 'anthropic';

// Model types
export interface Model {
  id: string;
  name: string;
  provider: AIProvider;
}

// Command execution result
export interface CommandResult {
  success: boolean;
  output: string;
  error?: string;
  exitCode?: number;
}

// File change type
export interface FileChange {
  path: string;
  content: string;
  operation: 'create' | 'modify' | 'delete';
}
