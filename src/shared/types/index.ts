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
}

declare global {
  interface Window {
    api: ElectronAPI;
  }
}
