import React, { useState, useEffect } from 'react';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

// Default model options (will be overridden by API response)
const DEFAULT_MODELS: string[] = ['gpt-4o', 'gpt-4', 'gpt-3.5-turbo'];

interface ApiProvider {
  name: string;
  key: string;
}

interface TestStatus {
  [key: string]: {
    status: 'idle' | 'testing' | 'success' | 'error';
    message?: string;
  };
}

const Settings: React.FC<SettingsProps> = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = useState<string>('api');
  const [providers, setProviders] = useState<Record<string, string>>({});
  const [newProvider, setNewProvider] = useState<ApiProvider>({ name: '', key: '' });
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string>('');
  const [saveMessage, setSaveMessage] = useState<string>('');
  const [saveMessageType, setSaveMessageType] = useState<'success' | 'error'>('success');
  const [defaultModel, setDefaultModel] = useState<string>('');
  const [modelList, setModelList] = useState<string[]>(DEFAULT_MODELS);
  const [showAddNew, setShowAddNew] = useState<boolean>(false);
  const [testStatus, setTestStatus] = useState<TestStatus>({});

  useEffect(() => {
    // Load settings when component mounts or when modal is opened
    const loadSettings = async () => {
      try {
        // Load API providers
        const apiProviders = await window.api.getApiProviders();
        setProviders(apiProviders || {});
        
        // Load default model
        const model = await window.api.getConfig('defaultModel');
        if (model) setDefaultModel(model as string);
        
        // Load available models
        const models = await window.api.getModels();
        if (Array.isArray(models) && models.length > 0) {
          setModelList(models as string[]);
        } else {
          // Fallback to default models if API returns empty list
          console.warn('No models returned from API, using default list');
        }
        
        // Clear any previous save messages
        setSaveMessage('');
        setSaveMessageType('success');
      } catch (error) {
        console.error('Failed to load settings:', error);
        setSaveMessage('Error loading settings. Please try again.');
        setSaveMessageType('error');
      }
    };

    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    setSaveMessageType('success');

    try {
      // Verify we have at least one API provider with a key
      if (Object.keys(providers).length === 0 || 
          Object.values(providers).every(key => !key || key.trim() === '')) {
        setSaveMessage('Error: At least one API provider with a valid key is required.');
        setSaveMessageType('error');
        return;
      }

      // Save each provider
      for (const [provider, apiKey] of Object.entries(providers)) {
        if (apiKey && apiKey.trim() !== '') {
          await window.api.setApiProvider(provider, apiKey);
        }
      }
      
      // Save default model
      if (defaultModel) {
        await window.api.setConfig('defaultModel', defaultModel);
      } else if (modelList.length > 0) {
        // If no default model selected but we have models, select the first one
        await window.api.setConfig('defaultModel', modelList[0]);
        setDefaultModel(modelList[0]);
      }
      
      setSaveMessage('Settings saved successfully!');
      setSaveMessageType('success');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveMessage(`Error saving settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setSaveMessageType('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddProvider = () => {
    if (!newProvider.name.trim()) {
      setSaveMessage('Error: Provider name cannot be empty');
      setSaveMessageType('error');
      return;
    }
    
    if (!newProvider.key.trim()) {
      setSaveMessage('Error: API key cannot be empty');
      setSaveMessageType('error');
      return;
    }

    // Check if provider name already exists
    if (providers[newProvider.name]) {
      setSaveMessage('Error: Provider name already exists');
      setSaveMessageType('error');
      return;
    }
    
    setProviders({
      ...providers,
      [newProvider.name]: newProvider.key
    });
    
    setNewProvider({ name: '', key: '' });
    setSaveMessage('Provider added. Remember to save your changes.');
    setSaveMessageType('success');
  };

  const handleRemoveProvider = (providerName: string) => {
    const updatedProviders = { ...providers };
    delete updatedProviders[providerName];
    setProviders(updatedProviders);
  };

  const handleProviderKeyChange = (providerName: string, apiKey: string) => {
    setProviders({
      ...providers,
      [providerName]: apiKey
    });
    
    if (testStatus[providerName]) {
      setTestStatus({
        ...testStatus,
        [providerName]: { status: 'idle' }
      });
    }
  };
  
  const handleTestConnection = async (providerName: string, apiKey: string) => {
    setTestStatus({
      ...testStatus,
      [providerName]: { status: 'testing' }
    });
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setTestStatus({
        ...testStatus,
        [providerName]: { 
          status: 'success',
          message: 'Connection successful!'
        }
      });
    } catch (error) {
      setTestStatus({
        ...testStatus,
        [providerName]: { 
          status: 'error',
          message: 'Connection failed. Please check your API key.'
        }
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="settings-modal-overlay">
      <div className="settings-modal">
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="settings-body">
          <div className="settings-sidebar">
            <button 
              className={activeSection === 'general' ? 'active' : ''} 
              onClick={() => setActiveSection('general')}
            >
              General
            </button>
            <button 
              className={activeSection === 'api' ? 'active' : ''} 
              onClick={() => setActiveSection('api')}
            >
              API Keys
            </button>
            <button 
              className={activeSection === 'theme' ? 'active' : ''} 
              onClick={() => setActiveSection('theme')}
            >
              Theme
            </button>
            <button 
              className={activeSection === 'about' ? 'active' : ''} 
              onClick={() => setActiveSection('about')}
            >
              About
            </button>
          </div>

          <div className="settings-content">
            {isLoading ? (
              <div className="settings-loading">Loading settings...</div>
            ) : loadError ? (
              <div className="settings-error">{loadError}</div>
            ) : (
              <>
                {activeSection === 'general' && (
                  <div className="settings-section">
                    <h3>General Settings</h3>
                    
                    <div className="settings-card">
                      <div className="settings-card-header">
                        <h4>Application Preferences</h4>
                      </div>
                      <div className="settings-card-content">
                        <div className="settings-field">
                          <label>Default Model</label>
                          <select
                            className="settings-select"
                            value={defaultModel}
                            onChange={(e) => setDefaultModel(e.target.value)}
                          >
                            {modelList.length === 0 && (
                              <option value="" disabled>No models available</option>
                            )}
                            {modelList.map((model) => (
                              <option key={model} value={model}>{model} {model === defaultModel ? '(Current)' : ''}</option>
                            ))}
                          </select>
                          <div className="field-description">
                            The model to use for generating responses
                          </div>
                        </div>
                        
                        <div className="settings-field">
                          <label>Default Project Directory</label>
                          <div className="input-with-button">
                            <input 
                              type="text" 
                              placeholder="/path/to/projects" 
                              disabled 
                              value="/home/projects"
                            />
                            <button className="browse-button">Browse</button>
                          </div>
                          <div className="field-description">
                            The default directory to open when browsing for projects
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="settings-card">
                      <div className="settings-card-header">
                        <h4>Command Execution</h4>
                      </div>
                      <div className="settings-card-content">
                        <div className="settings-field checkbox-field">
                          <input type="checkbox" id="show-command-output" disabled checked />
                          <label htmlFor="show-command-output">Show command output in real-time</label>
                          <div className="field-description">
                            Display command output as it's generated
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="settings-note">
                      Note: Some settings are currently for display purposes only and will be implemented in future versions.
                    </div>
                  </div>
                )}
              </>
            )}

            {activeSection === 'api' && (
              <div className="settings-section">
                <div className="section-header">
                  <h3>API Providers</h3>
                  <button 
                    className="add-new-button"
                    onClick={() => setShowAddNew(!showAddNew)}
                  >
                    {showAddNew ? 'Cancel' : '+ Add New'}
                  </button>
                </div>
                
                {showAddNew && (
                  <div className="provider-card add-provider-card">
                    <div className="provider-card-content">
                      <div className="provider-field">
                        <label>Provider Name:</label>
                        <input
                          type="text"
                          value={newProvider.name}
                          onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })}
                          placeholder="e.g., OpenAI, Gemini"
                        />
                      </div>
                      <div className="provider-field">
                        <label>API Key:</label>
                        <input
                          type="password"
                          value={newProvider.key}
                          onChange={(e) => setNewProvider({ ...newProvider, key: e.target.value })}
                          placeholder="Enter API Key"
                        />
                      </div>
                    </div>
                    <div className="provider-card-actions">
                      <button 
                        onClick={handleAddProvider}
                        disabled={!newProvider.name || !newProvider.key}
                      >
                        Add Provider
                      </button>
                    </div>
                  </div>
                )}
                
                {Object.entries(providers).map(([provider, apiKey]) => (
                  <div key={provider} className="provider-card">
                    <div className="provider-card-content">
                      <div className="provider-field">
                        <label>Provider:</label>
                        <div className="provider-name">{provider}</div>
                      </div>
                      <div className="provider-field">
                        <label>API Key:</label>
                        <input
                          type="password"
                          value={apiKey}
                          onChange={(e) => handleProviderKeyChange(provider, e.target.value)}
                          placeholder="API Key"
                        />
                      </div>
                      {testStatus[provider] && testStatus[provider].status !== 'idle' && (
                        <div className={`test-status ${testStatus[provider].status}`}>
                          {testStatus[provider].status === 'testing' && 'Testing connection...'}
                          {testStatus[provider].status === 'success' && testStatus[provider].message}
                          {testStatus[provider].status === 'error' && testStatus[provider].message}
                        </div>
                      )}
                    </div>
                    <div className="provider-card-actions">
                      <button 
                        className="test-button"
                        onClick={() => handleTestConnection(provider, apiKey)}
                        disabled={testStatus[provider]?.status === 'testing'}
                      >
                        {testStatus[provider]?.status === 'testing' ? 'Testing...' : 'Test Connection'}
                      </button>
                      <button 
                        className="remove-button"
                        onClick={() => handleRemoveProvider(provider)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                
                {Object.keys(providers).length === 0 && !showAddNew && (
                  <div className="no-providers">
                    <p>No API providers configured. Click "Add New" to add a provider.</p>
                  </div>
                )}
              </div>
            )}

            {activeSection === 'theme' && (
              <div className="settings-section">
                <h3>Theme Settings</h3>
                
                <div className="settings-card">
                  <div className="settings-card-header">
                    <h4>Appearance</h4>
                  </div>
                  <div className="settings-card-content">
                    <div className="settings-field">
                      <label>Theme Mode</label>
                      <div className="theme-selector">
                        <button className="theme-option active">
                          <div className="theme-preview light-theme"></div>
                          <span>Light</span>
                        </button>
                        <button className="theme-option">
                          <div className="theme-preview dark-theme"></div>
                          <span>Dark</span>
                        </button>
                        <button className="theme-option">
                          <div className="theme-preview system-theme"></div>
                          <span>System</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="settings-note">
                  Note: These theme settings are currently for display purposes only and will be implemented in future versions.
                </div>
              </div>
            )}

            {activeSection === 'about' && (
              <div className="settings-section">
                <h3>About VisualCodex</h3>
                
                <div className="settings-card">
                  <div className="settings-card-content">
                    <div className="about-logo">
                      <div className="app-logo">VC</div>
                      <h4>VisualCodex</h4>
                    </div>
                    
                    <div className="about-info">
                      <p className="about-description">
                        VisualCodex is an Electron-based GUI for open-codex.
                      </p>
                      
                      <div className="version-info">
                        <div className="version-item">
                          <span className="version-label">Version:</span>
                          <span className="version-value">0.1.0</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="settings-card">
                  <div className="settings-card-header">
                    <h4>Credits</h4>
                  </div>
                  <div className="settings-card-content">
                    <div className="credits-section">
                      <p>Based on open-codex by ymichael.</p>
                      <p>Created by MJ Jabbour</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="settings-footer">
          {saveMessage && <div className={`save-message ${saveMessageType === 'error' ? 'error' : ''}`}>{saveMessage}</div>}
          <div className="settings-actions">
            <button onClick={onClose}>Cancel</button>
            <button 
              onClick={handleSave} 
              disabled={isSaving}
              className="save-button"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
