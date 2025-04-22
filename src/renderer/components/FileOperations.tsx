import React, { useState } from 'react';
import '../styles/file-operations.css';

interface FileOperationsProps {
  approvalMode: string;
}

const FileOperations: React.FC<FileOperationsProps> = ({ approvalMode }) => {
  const [filePath, setFilePath] = useState<string>('');
  const [fileContent, setFileContent] = useState<string>('');
  const [operation, setOperation] = useState<string>('read');
  const [result, setResult] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [needsApproval, setNeedsApproval] = useState<boolean>(false);

  const handleFilePathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilePath(e.target.value);
  };

  const handleFileContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFileContent(e.target.value);
  };

  const handleOperationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setOperation(e.target.value);
  };

  const performOperation = async () => {
    if (!filePath.trim()) return;

    // Check if operation needs approval based on approval mode
    if (approvalMode !== 'full-auto' && (operation === 'write' || operation === 'delete')) {
      setNeedsApproval(true);
      return;
    }

    await executeOperation();
  };

  const executeOperation = async () => {
    setIsProcessing(true);
    setResult('Processing...');
    setNeedsApproval(false);

    try {
      switch (operation) {
        case 'read':
          const readResult = await window.api.readFile(filePath);
          if (readResult.success) {
            setFileContent(readResult.content);
            setResult(`File read successfully: ${filePath}`);
          } else {
            setResult(`Error reading file: ${readResult.error}`);
          }
          break;
        case 'write':
          const writeResult = await window.api.writeFile(filePath, fileContent);
          if (writeResult.success) {
            setResult(`File written successfully: ${filePath}`);
          } else {
            setResult(`Error writing file: ${writeResult.error}`);
          }
          break;
        default:
          setResult('Unknown operation');
      }
    } catch (error) {
      console.error('Failed to perform file operation:', error);
      setResult(`Error: Failed to perform operation. ${error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const selectFile = async () => {
    try {
      const result = await window.api.selectDirectory();
      if (!result.canceled) {
        setFilePath(result.directory);
      }
    } catch (error) {
      console.error('Failed to select file:', error);
    }
  };

  const approveOperation = () => {
    executeOperation();
  };

  const rejectOperation = () => {
    setNeedsApproval(false);
    setResult('Operation cancelled by user.');
  };

  return (
    <div className="file-operations">
      <div className="file-operations-form">
        <div className="form-row">
          <label htmlFor="file-path">File Path:</label>
          <div className="file-path-input">
            <input
              id="file-path"
              type="text"
              value={filePath}
              onChange={handleFilePathChange}
              placeholder="Enter file path"
              disabled={isProcessing || needsApproval}
            />
            <button 
              onClick={selectFile}
              disabled={isProcessing || needsApproval}
            >
              Browse
            </button>
          </div>
        </div>
        
        <div className="form-row">
          <label htmlFor="operation">Operation:</label>
          <select
            id="operation"
            value={operation}
            onChange={handleOperationChange}
            disabled={isProcessing || needsApproval}
          >
            <option value="read">Read</option>
            <option value="write">Write</option>
          </select>
        </div>
        
        <div className="form-row">
          <label htmlFor="file-content">Content:</label>
          <textarea
            id="file-content"
            value={fileContent}
            onChange={handleFileContentChange}
            placeholder={operation === 'read' ? 'Content will appear here after reading' : 'Enter file content'}
            rows={5}
            disabled={isProcessing || needsApproval || operation === 'read'}
          />
        </div>
        
        <div className="form-actions">
          <button 
            onClick={performOperation}
            disabled={isProcessing || needsApproval || !filePath.trim()}
          >
            {operation === 'read' ? 'Read File' : 'Write File'}
          </button>
        </div>
      </div>

      {needsApproval && (
        <div className="approval-prompt">
          <div className="approval-message">
            <p>Do you want to {operation} this file?</p>
            <pre>{filePath}</pre>
            {operation === 'write' && (
              <>
                <p>Content:</p>
                <pre>{fileContent}</pre>
              </>
            )}
          </div>
          <div className="approval-actions">
            <button onClick={rejectOperation} className="reject-button">Reject</button>
            <button onClick={approveOperation} className="approve-button">Approve</button>
          </div>
        </div>
      )}

      {result && (
        <div className="operation-result">
          <h3>Result:</h3>
          <pre>{result}</pre>
        </div>
      )}
    </div>
  );
};

export default FileOperations;
