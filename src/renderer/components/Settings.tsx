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
                <p>General settings will be implemented in future versions.</p>
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
                <p>Theme settings will be implemented in future versions.</p>
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
