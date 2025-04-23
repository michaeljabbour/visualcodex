import React, { useState, useEffect } from 'react';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

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
  const [saveMessage, setSaveMessage] = useState<string>('');
  const [showAddNew, setShowAddNew] = useState<boolean>(false);
  const [testStatus, setTestStatus] = useState<TestStatus>({});

  useEffect(() => {
    // Load API providers when component mounts
    const loadProviders = async () => {
      try {
        const apiProviders = await window.api.getApiProviders();
        setProviders(apiProviders || {});
      } catch (error) {
        console.error('Failed to load API providers:', error);
      }
    };

    if (isOpen) {
      loadProviders();
      setShowAddNew(false);
      setTestStatus({});
    }
  }, [isOpen]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');

    try {
      // Save each provider
      for (const [provider, apiKey] of Object.entries(providers)) {
        await window.api.setApiProvider(provider, apiKey);
      }
      
      setSaveMessage('Settings saved successfully!');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveMessage('Error saving settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddProvider = () => {
    if (newProvider.name && newProvider.key) {
      setProviders({
        ...providers,
        [newProvider.name]: newProvider.key
      });
      setNewProvider({ name: '', key: '' });
      setShowAddNew(false);
    }
  };

  const handleRemoveProvider = (providerName: string) => {
    const updatedProviders = { ...providers };
    delete updatedProviders[providerName];
    setProviders(updatedProviders);
    
    if (testStatus[providerName]) {
      const updatedTestStatus = { ...testStatus };
      delete updatedTestStatus[providerName];
      setTestStatus(updatedTestStatus);
    }
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

        <div className="settings-container">
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
            {activeSection === 'general' && (
              <div className="settings-section">
                <h3>General Settings</h3>
                
                <div className="settings-card">
                  <div className="settings-card-header">
                    <h4>Application Preferences</h4>
                  </div>
                  <div className="settings-card-content">
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
                    
                    <div className="settings-field">
                      <label>Editor Font Size</label>
                      <select className="settings-select" disabled>
                        <option>12px</option>
                        <option>14px</option>
                        <option selected>16px</option>
                        <option>18px</option>
                        <option>20px</option>
                      </select>
                      <div className="field-description">
                        Font size used in the editor and response areas
                      </div>
                    </div>
                    
                    <div className="settings-field checkbox-field">
                      <input type="checkbox" id="auto-save" disabled checked />
                      <label htmlFor="auto-save">Auto-save changes</label>
                      <div className="field-description">
                        Automatically save changes when executing commands
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="settings-card">
                  <div className="settings-card-header">
                    <h4>Command Execution</h4>
                  </div>
                  <div className="settings-card-content">
                    <div className="settings-field">
                      <label>Default Timeout (seconds)</label>
                      <input 
                        type="number" 
                        min="10" 
                        max="300" 
                        disabled 
                        value="60"
                      />
                      <div className="field-description">
                        Maximum time to wait for command execution
                      </div>
                    </div>
                    
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
                  Note: These settings are currently for display purposes only and will be implemented in future versions.
                </div>
              </div>
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
                    
                    <div className="settings-field">
                      <label>Accent Color</label>
                      <div className="color-selector">
                        <button className="color-option active" style={{ backgroundColor: '#3498db' }}></button>
                        <button className="color-option" style={{ backgroundColor: '#2ecc71' }}></button>
                        <button className="color-option" style={{ backgroundColor: '#e74c3c' }}></button>
                        <button className="color-option" style={{ backgroundColor: '#9b59b6' }}></button>
                        <button className="color-option" style={{ backgroundColor: '#f39c12' }}></button>
                        <button className="color-option" style={{ backgroundColor: '#1abc9c' }}></button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="settings-card">
                  <div className="settings-card-header">
                    <h4>Editor Appearance</h4>
                  </div>
                  <div className="settings-card-content">
                    <div className="settings-field">
                      <label>Font Family</label>
                      <select className="settings-select" disabled>
                        <option>Monospace</option>
                        <option selected>Consolas</option>
                        <option>Courier New</option>
                        <option>Source Code Pro</option>
                        <option>Fira Code</option>
                      </select>
                    </div>
                    
                    <div className="settings-field">
                      <label>Line Height</label>
                      <div className="range-slider">
                        <input 
                          type="range" 
                          min="1" 
                          max="2" 
                          step="0.1" 
                          value="1.5" 
                          disabled
                        />
                        <span className="range-value">1.5</span>
                      </div>
                    </div>
                    
                    <div className="settings-field checkbox-field">
                      <input type="checkbox" id="show-line-numbers" disabled checked />
                      <label htmlFor="show-line-numbers">Show line numbers</label>
                    </div>
                    
                    <div className="settings-field checkbox-field">
                      <input type="checkbox" id="word-wrap" disabled checked />
                      <label htmlFor="word-wrap">Word wrap</label>
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
                <p>VisualCodex is an Electron-based GUI for open-codex.</p>
                <p>Version: 0.1.0</p>
                <p>Based on open-codex by ymichael.</p>
              </div>
            )}
          </div>
        </div>

        <div className="settings-footer">
          {saveMessage && <div className="save-message">{saveMessage}</div>}
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
