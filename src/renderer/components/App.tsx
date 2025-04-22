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
  const [error, setError] = useState<string | null>(null);
  
  // Load initial configuration
  useEffect(() => {
    const loadConfig = async () => {
      try {
        console.log('App: Loading initial configuration...');
        
        // Check if window.api exists
        if (!window.api) {
          throw new Error('API not available. The preload script may not be loaded correctly.');
        }
        
        console.log('App: API is available, fetching approval mode...');
        const mode = await window.api.getApprovalMode();
        console.log('App: Approval mode loaded:', mode);
        if (mode) setApprovalMode(mode);
        
        console.log('App: Fetching default model...');
        const model = await window.api.getConfig('defaultModel');
        console.log('App: Default model loaded:', model);
        if (model) setSelectedModel(model);
        
        console.log('App: Configuration loaded successfully');
        setIsInitialized(true);
      } catch (error) {
        console.error('App: Failed to load configuration:', error);
        setError(error instanceof Error ? error.message : String(error));
        setIsInitialized(true); // Still set initialized to true to show error message
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
      setError('Failed to update approval mode. Please try again.');
    }
  };
  
  const handleModelChange = async (model: string) => {
    try {
      await window.api.setConfig('defaultModel', model);
      setSelectedModel(model);
    } catch (error) {
      console.error('Failed to update model:', error);
      setError('Failed to update model. Please try again.');
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
  
  if (error) {
    return (
      <div className="error-container">
        <h2>Error Loading Application</h2>
        <p>{error}</p>
        <p>Please check the console for more details or restart the application.</p>
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
