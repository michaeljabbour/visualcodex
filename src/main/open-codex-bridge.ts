import { ipcMain } from 'electron';
import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import * as https from 'https';

// Define return type for executeCommand
interface CommandResult {
  success: boolean;
  output: string;
  error?: string;
  exitCode?: number;
}

// Define operation types that can be extracted from LLM responses
enum OperationType {
  FileRead = 'file-read',
  FileWrite = 'file-write',
  CommandExecution = 'command',
  DirectResponse = 'response'
}

// Operation interface for actions extracted from LLM responses
interface Operation {
  type: OperationType;
  content?: string;
  path?: string;
  command?: string;
}

// Import electron-store
import ElectronStore from 'electron-store';

// Initialize store to access API keys
const store = new ElectronStore({
  name: 'visualcodex-config'
});

// Function to execute a command with agentic behavior
export async function executeCommand(
  prompt: string, 
  cwd: string, 
  approvalMode: string = 'none'
): Promise<CommandResult> {
  return new Promise(async (resolve, reject) => {
    try {
      // Get API providers from store
      const apiProviders = store.get('apiProviders') as Record<string, string> || {};
      const defaultModel = store.get('defaultModel') as string || 'gpt-4o';
      
      // Try to get the API key based on the model provider (OpenAI is default)
      let apiKey = '';
      
      // Check for OpenAI key
      if (apiProviders['OpenAI']) {
        apiKey = apiProviders['OpenAI'];
      } else if (Object.values(apiProviders).length > 0) {
        // Use the first available API key if no OpenAI key
        apiKey = Object.values(apiProviders)[0];
      } else {
        // Fallback to environment variable
        apiKey = process.env.OPENAI_API_KEY || '';
      }
      
      if (!apiKey) {
        reject(new Error('API key not found. Please set it in the settings.'));
        return;
      }
      
      console.log(`Using model: ${defaultModel}`);
      
      // Make initial API call to get response
      const initialResponse = await makeOpenAIRequest(apiKey, defaultModel, prompt, cwd);
      
      // Parse the response to extract operations (file reads/writes, commands)
      const operations = parseOperationsFromResponse(initialResponse);
      
      // Handle operations based on approval mode
      const results = await handleOperations(operations, approvalMode, cwd, apiKey, defaultModel);
      
      // Format final response
      const formattedResponse = formatResults(results);
      
      resolve({
        success: true,
        output: formattedResponse,
        exitCode: 0
      });
    } catch (error) {
      console.error('Error executing command:', error);
      reject(error);
    }
  });
}

// Make OpenAI API request
async function makeOpenAIRequest(
  apiKey: string, 
  model: string,
  prompt: string,
  cwd: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Create a Claude-like system prompt that encourages thoughtful reasoning
    const systemMessage = `You are Claude, a helpful AI assistant with deep expertise in software development and code analysis.
You are analyzing a repository located at: ${cwd}.

Your goal is to provide insightful, nuanced, and thoughtful responses to questions about this codebase.
Think step-by-step and show your reasoning process openly.

When answering questions:
1. First, gather relevant information about the code (you can read files by writing "Read file: <path>")
2. Analyze the information to form a coherent mental model of the codebase
3. Consider multiple perspectives or approaches before settling on an answer
4. Be curious and identify gaps in your understanding that need further investigation
5. Focus on the most important aspects while acknowledging limitations in your knowledge

When suggesting improvements or solutions:
- Consider trade-offs between different approaches
- Think about maintainability, performance, readability, and security
- Provide reasoning behind your suggestions, not just what to change

You can access the filesystem and execute commands:
- To read files: "Read file: <path>"
- To write files: Use code blocks with file paths: \`\`\`<path>\n<content>\n\`\`\`
- To execute commands: "Execute: <command>"

Remember to analyze and reason through problems carefully before answering.`;

    // Prepare the API request payload with a higher temperature for more thoughtful responses
    const requestData = JSON.stringify({
      model: model,
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: prompt }
      ],
      temperature: 0.9,
      max_tokens: 4000 // Allow for more detailed responses
    });
    
    // Set up the HTTPS request options
    const options = {
      hostname: 'api.openai.com',
      port: 443,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
        'Content-Length': Buffer.byteLength(requestData)
      }
    };
    
    // Make the request to the OpenAI API
    const req = https.request(options, (res) => {
      let data = '';
      
      // Collect the response data
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      // Process the complete response
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          // Handle API errors
          if (response.error) {
            reject(new Error(response.error.message || "API error"));
            return;
          } 
          // Handle successful responses
          else if (response.choices && response.choices[0]) {
            // Extract just the message content
            const result = response.choices[0].message.content;
            resolve(result);
          } 
          // Handle unexpected response format
          else {
            reject(new Error("Invalid response from API"));
          }
        } catch (e: unknown) {
          // Handle JSON parsing errors
          const errorMessage = e instanceof Error ? e.message : String(e);
          reject(new Error(`Failed to parse response: ${errorMessage}`));
        }
      });
    });
    
    // Handle request errors
    req.on('error', (e) => {
      reject(new Error(`Request error: ${e.message}`));
    });
    
    // Send the request
    req.write(requestData);
    req.end();
  });
}

// Parse operations from the LLM response
function parseOperationsFromResponse(response: string): Operation[] {
  const operations: Operation[] = [];
  
  // Extract file writing operations (code blocks with file paths as titles)
  // Only match code blocks that are prefixed with "Write to:" or have specific file extensions
  const fileWriteRegex = /```(?:Write to: )?([^`\n]+\.(?:js|ts|jsx|tsx|css|html|json|md|py|rb|go|rs|php|java|c|cpp|h|hpp|cs|sql))(?:\n|\r\n)([\s\S]*?)```/g;
  let fileWriteMatch;
  
  while ((fileWriteMatch = fileWriteRegex.exec(response)) !== null) {
    const filePath = fileWriteMatch[1].trim();
    const content = fileWriteMatch[2];
    
    // Skip if it looks like an example in documentation
    if (filePath.toLowerCase().includes('example') || 
        filePath.toLowerCase().includes('sample') ||
        filePath.toLowerCase().startsWith('bash') ||
        filePath.toLowerCase().startsWith('javascript') ||
        filePath.toLowerCase().startsWith('typescript')) {
      continue;
    }
    
    operations.push({
      type: OperationType.FileWrite,
      path: filePath,
      content: content
    });
  }
  
  // Extract command execution operations with clear "Execute:" prefix
  const commandRegex = /Execute: (.+)(?:\n|$)/g;
  let commandMatch;
  
  while ((commandMatch = commandRegex.exec(response)) !== null) {
    const command = commandMatch[1].trim();
    
    operations.push({
      type: OperationType.CommandExecution,
      command: command
    });
  }
  
  // Extract file read operations with clear "Read file:" prefix
  const fileReadRegex = /Read file: (.+)(?:\n|$)/g;
  let fileReadMatch;
  
  while ((fileReadMatch = fileReadRegex.exec(response)) !== null) {
    const filePath = fileReadMatch[1].trim();
    
    operations.push({
      type: OperationType.FileRead,
      path: filePath
    });
  }
  
  // If no operations were extracted, treat the entire response as a direct message
  if (operations.length === 0) {
    operations.push({
      type: OperationType.DirectResponse,
      content: response
    });
  }
  
  return operations;
}

// Handle the operations based on approval mode
async function handleOperations(
  operations: Operation[],
  approvalMode: string, 
  cwd: string,
  apiKey: string,
  model: string
): Promise<string[]> {
  const results: string[] = [];
  
  // Create a map of operations by type
  const operationsByType = operations.reduce((acc, operation) => {
    if (!acc[operation.type]) {
      acc[operation.type] = [];
    }
    acc[operation.type].push(operation);
    return acc;
  }, {} as Record<string, Operation[]>);
  
  // First, handle all file read operations
  const fileReadOperations = operationsByType[OperationType.FileRead] || [];
  const fileReadResults = await Promise.all(
    fileReadOperations.map(async (operation) => {
      if (!operation.path) return "Error: Missing file path";
      
      try {
        const filePath = path.isAbsolute(operation.path) 
          ? operation.path 
          : path.join(cwd, operation.path);
        
        const content = await fs.readFile(filePath, 'utf8');
        return `File content (${operation.path}):\n\n${content}`;
      } catch (error) {
        return `Error reading file ${operation.path}: ${error instanceof Error ? error.message : String(error)}`;
      }
    })
  );
  
  results.push(...fileReadResults);
  
  // If there were file read operations, send a follow-up request with the file contents
  if (fileReadResults.length > 0) {
    const followUpPrompt = `I've read the files you requested. Here are the contents:

${fileReadResults.join('\n\n')}

Continue with your reasoning process based on these files. Think step-by-step about what this tells you about the codebase and how it relates to the original question. If you need to see more files to form a complete picture, you can request them.`;
    
    const followUpResponse = await makeOpenAIRequest(apiKey, model, followUpPrompt, cwd);
    
    // Add the follow-up response as a direct response operation to operations list
    const directResponseOperation = {
      type: OperationType.DirectResponse,
      content: followUpResponse
    };
    operations.push(directResponseOperation);
    
    // Also add to operationsByType for proper handling
    if (!operationsByType[OperationType.DirectResponse]) {
      operationsByType[OperationType.DirectResponse] = [];
    }
    operationsByType[OperationType.DirectResponse].push(directResponseOperation);
    
    // Parse and handle any new operations in the follow-up response
    const followUpOperations = parseOperationsFromResponse(followUpResponse);
    
    // Filter out file read operations from the follow-up to avoid loops
    const nonReadOperations = followUpOperations.filter(op => 
      op.type !== OperationType.FileRead && 
      op.type !== OperationType.DirectResponse // Skip direct responses as we've already added the whole response
    );
    
    // Update the operations list with new operations from follow-up
    operations.push(...nonReadOperations);
    
    // Update operations by type map
    nonReadOperations.forEach(operation => {
      if (!operationsByType[operation.type]) {
        operationsByType[operation.type] = [];
      }
      operationsByType[operation.type].push(operation);
    });
  }
  
  // Handle direct response operations
  const directResponseOperations = operationsByType[OperationType.DirectResponse] || [];
  const directResponses = directResponseOperations.map(op => op.content || "");
  results.push(...directResponses);
  
  // Handle file write operations based on approval mode
  const fileWriteOperations = operationsByType[OperationType.FileWrite] || [];
  
  // In suggest mode, only describe the changes
  if (approvalMode === 'suggest') {
    const fileChangeDescriptions = fileWriteOperations.map(op => {
      return `Would write to file: ${op.path}\n\`\`\`\n${op.content}\n\`\`\``;
    });
    results.push(...fileChangeDescriptions);
  } 
  // In auto-edit or full-auto mode, apply the changes
  else if (approvalMode === 'auto-edit' || approvalMode === 'full-auto') {
    const fileWriteResults = await Promise.all(
      fileWriteOperations.map(async (operation) => {
        if (!operation.path || !operation.content) return "Error: Missing path or content";
        
        try {
          const filePath = path.isAbsolute(operation.path) 
            ? operation.path 
            : path.join(cwd, operation.path);
            
          // Create parent directories if they don't exist
          const parentDir = path.dirname(filePath);
          await fs.mkdir(parentDir, { recursive: true });
          
          // Write the file
          await fs.writeFile(filePath, operation.content, 'utf8');
          return `Successfully wrote to file: ${operation.path}`;
        } catch (error) {
          return `Error writing file ${operation.path}: ${error instanceof Error ? error.message : String(error)}`;
        }
      })
    );
    results.push(...fileWriteResults);
  }
  
  // Handle command execution operations based on approval mode
  const commandOperations = operationsByType[OperationType.CommandExecution] || [];
  
  // In suggest mode, only describe the commands
  if (approvalMode === 'suggest') {
    const commandDescriptions = commandOperations.map(op => {
      return `Would execute command: ${op.command}`;
    });
    results.push(...commandDescriptions);
  } 
  // In full-auto mode, execute the commands
  else if (approvalMode === 'full-auto') {
    const commandResults = await Promise.all(
      commandOperations.map(async (operation) => {
        if (!operation.command) return "Error: Missing command";
        
        try {
          // Execute the command
          const result = await executeShellCommand(operation.command, cwd);
          return `Command: ${operation.command}\nResult:\n${result.stdout}\n${result.stderr ? 'Error: ' + result.stderr : ''}`;
        } catch (error) {
          return `Error executing command ${operation.command}: ${error instanceof Error ? error.message : String(error)}`;
        }
      })
    );
    results.push(...commandResults);
  }
  
  return results;
}

// Execute a shell command
async function executeShellCommand(command: string, cwd: string): Promise<{stdout: string, stderr: string, exitCode: number}> {
  return new Promise((resolve) => {
    // Execute the command in a subprocess
    const process = spawn(command, [], {
      cwd,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    process.on('close', (code) => {
      resolve({
        stdout,
        stderr,
        exitCode: code !== null ? code : -1
      });
    });
  });
}

// Format the results into a single string
function formatResults(results: string[]): string {
  return results.join('\n\n');
}

// Setup IPC handlers for renderer process
export function setupOpenCodexHandlers(): void {
  // Alias for backward compatibility: execute-open-codex invokes open-codex command
  ipcMain.handle('execute-open-codex', async (event, prompt: string, approvalMode: string) => {
    const cwd = process.cwd();
    try {
      const result = await executeCommand(prompt, cwd, approvalMode);
      return result;
    } catch (error: unknown) {
      console.error('Error executing open-codex:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  });

  // Execute command (direct)
  ipcMain.handle('execute-command', async (event, command: string, cwd: string, approvalMode: string) => {
    try {
      const result = await executeCommand(command, cwd, approvalMode);
      return result;
    } catch (error: unknown) {
      console.error('Error executing command:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  });

  // Read file
  ipcMain.handle('read-file', async (event, filePath: string) => {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return {
        success: true,
        content
      };
    } catch (error: unknown) {
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
      await fs.writeFile(filePath, content, 'utf8');
      return {
        success: true
      };
    } catch (error: unknown) {
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
    } catch (error: unknown) {
      console.error('Error getting project files:', error);
      return {
        success: false,
        files: [],
        error: error instanceof Error ? error.message : String(error)
      };
    }
  });
}