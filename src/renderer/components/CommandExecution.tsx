import React, { useState, useEffect } from 'react';
import '../styles/command-execution.css';

interface CommandExecutionProps {
  approvalMode: string;
}

const CommandExecution: React.FC<CommandExecutionProps> = ({ approvalMode }) => {
  const [command, setCommand] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [needsApproval, setNeedsApproval] = useState<boolean>(false);
  const [workingDirectory, setWorkingDirectory] = useState<string>(process.cwd());

  const handleCommandChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCommand(e.target.value);
  };

  const executeCommand = async () => {
    if (!command.trim()) return;

    // Check if command needs approval based on approval mode
    if (approvalMode !== 'full-auto') {
      setNeedsApproval(true);
      return;
    }

    await runCommand();
  };

  const runCommand = async () => {
    setIsExecuting(true);
    setOutput('Executing command...');
    setNeedsApproval(false);

    try {
      // Execute the command through open-codex
      const result = await window.api.executeOpenCodex(command, approvalMode);
      
      if (result.success) {
        setOutput(result.output);
      } else {
        setOutput(`Error: ${result.error || 'Failed to execute command'}\n\n${result.output || ''}`);
      }
    } catch (error) {
      console.error('Failed to execute command:', error);
      setOutput(`Error: Failed to execute command. ${error}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const approveCommand = () => {
    runCommand();
  };

  const rejectCommand = () => {
    setNeedsApproval(false);
    setOutput('Command execution cancelled by user.');
  };

  const selectWorkingDirectory = async () => {
    try {
      const result = await window.api.selectDirectory();
      if (!result.canceled) {
        setWorkingDirectory(result.directory);
      }
    } catch (error) {
      console.error('Failed to select directory:', error);
    }
  };

  return (
    <div className="command-execution">
      <div className="working-directory">
        <label>Working Directory:</label>
        <div className="directory-selector">
          <input 
            type="text" 
            value={workingDirectory} 
            onChange={(e) => setWorkingDirectory(e.target.value)}
            disabled={isExecuting || needsApproval}
          />
          <button 
            onClick={selectWorkingDirectory}
            disabled={isExecuting || needsApproval}
          >
            Browse
          </button>
        </div>
      </div>
      
      <div className="command-input-area">
        <input
          type="text"
          value={command}
          onChange={handleCommandChange}
          placeholder="Enter command to execute"
          disabled={isExecuting || needsApproval}
        />
        <button 
          onClick={executeCommand}
          disabled={isExecuting || needsApproval || !command.trim()}
        >
          Execute
        </button>
      </div>

      {needsApproval && (
        <div className="approval-prompt">
          <div className="approval-message">
            <p>Do you want to execute this command?</p>
            <pre>{command}</pre>
          </div>
          <div className="approval-actions">
            <button onClick={rejectCommand} className="reject-button">Reject</button>
            <button onClick={approveCommand} className="approve-button">Approve</button>
          </div>
        </div>
      )}

      {output && (
        <div className="command-output">
          <h3>Output:</h3>
          <pre>{output}</pre>
        </div>
      )}
    </div>
  );
};

export default CommandExecution;
