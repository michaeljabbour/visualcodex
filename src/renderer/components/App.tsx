import React, { useState, useEffect } from 'react';
import '../styles/app.css';
import Settings from './Settings';
import Sidebar from './Sidebar';
import ResponseArea from './ResponseArea';
import InputArea from './InputArea';
import Footer from './Footer';
import OperationsTabs from './OperationsTabs';

const App: React.FC = () => {
  const [approvalMode, setApprovalMode] = useState<string>('suggest');
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [showOperations, setShowOperations] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  
  // Load initial configuration
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const mode = await window.api.getApprovalMode();
        if (mode) setApprovalMode(mode);
        
        const model = await window.api.getConfig('defaultModel');
        if (model) setSelectedModel(model);
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to load configuration:', error);
        setIsInitialized(true);
      }
    };
    
    loadConfig();
  }, []);
  
  const handleApprovalModeChange = async (mode: string) => {
    try {
      await window.api.setApprovalMode(mode);
      setApprovalMode(mode);
    } catch (error) {
      console.error('Failed to update approval mode:', error);
    }
  };
  
  const handleModelChange = async (model: string) => {
    try {
      await window.api.setConfig('defaultModel', model);
      setSelectedModel(model);
    } catch (error) {
      console.error('Failed to update model:', error);
    }
  };
  
  const toggleSettings = () => {
    setIsSettingsOpen(!isSettingsOpen);
  };

  const toggleOperations = () => {
    setShowOperations(!showOperations);
  };
  
  if (!isInitialized) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading VisualCodex...</p>
      </div>
    );
  }
  
  return (
    <div className="container">
      <div className="content">
        <Sidebar />
        <div className="main-panel">
          <ResponseArea />
          {showOperations && (
            <OperationsTabs approvalMode={approvalMode} />
          )}
          <InputArea />
          <div className="operations-toggle">
            <button onClick={toggleOperations}>
              {showOperations ? 'Hide Operations' : 'Show Operations'}
            </button>
          </div>
        </div>
      </div>
      <Footer 
        approvalMode={approvalMode}
        selectedModel={selectedModel}
        onApprovalModeChange={handleApprovalModeChange}
        onModelChange={handleModelChange}
        onSettingsClick={toggleSettings}
      />
      
      <Settings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};

export default App;
