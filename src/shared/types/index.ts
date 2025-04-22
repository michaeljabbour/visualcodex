export interface ElectronAPI {
  getConfig: (key: string) => Promise<any>;
  setConfig: (key: string, value: any) => Promise<boolean>;
  getApprovalMode: () => Promise<string>;
  setApprovalMode: (mode: string) => Promise<boolean>;
  getApiProviders: () => Promise<Record<string, string>>;
  setApiProvider: (provider: string, apiKey: string) => Promise<boolean>;
  executeOpenCodex: (prompt: string, approvalMode: string) => Promise<{success: boolean, output: string, error?: string}>;
  getProjectFiles: (dirPath: string) => Promise<{success: boolean, files: any[], error?: string}>;
  selectDirectory: () => Promise<{canceled: boolean, directory: string}>;
  readFile: (path: string) => Promise<{success: boolean, content: string, error?: string}>;
  writeFile: (path: string, content: string) => Promise<{success: boolean, error?: string}>;
}

declare global {
  interface Window {
    api: ElectronAPI;
    addResponse?: (type: string, content: string) => void;
    clearResponses?: () => void;
  }
}
