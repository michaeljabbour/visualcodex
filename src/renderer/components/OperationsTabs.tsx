import React, { useState } from 'react';
import '../styles/file-operations.css';
import CommandExecution from './CommandExecution';
import FileOperations from './FileOperations';

interface OperationsTabsProps {
  approvalMode: string;
}

const OperationsTabs: React.FC<OperationsTabsProps> = ({ approvalMode }) => {
  const [activeTab, setActiveTab] = useState<string>('command');

  return (
    <div className="operations-tabs">
      <div className="tabs-header">
        <button 
          className={activeTab === 'command' ? 'active' : ''}
          onClick={() => setActiveTab('command')}
        >
          Command Execution
        </button>
        <button 
          className={activeTab === 'file' ? 'active' : ''}
          onClick={() => setActiveTab('file')}
        >
          File Operations
        </button>
      </div>
      
      <div className="tabs-content">
        {activeTab === 'command' && (
          <CommandExecution approvalMode={approvalMode} />
        )}
        
        {activeTab === 'file' && (
          <FileOperations approvalMode={approvalMode} />
        )}
      </div>
    </div>
  );
};

export default OperationsTabs;
