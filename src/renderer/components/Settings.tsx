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

const Settings: React.FC<SettingsProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<string>('api');
  const [providers, setProviders] = useState<Record<string, string>>({});
  const [newProvider, setNewProvider] = useState<ApiProvider>({ name: '', key: '' });
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string>('');
  const [saveMessage, setSaveMessage] = useState<string>('');
  const [saveMessageType, setSaveMessageType] = useState<'success' | 'error'>('success');
  const [defaultModel, setDefaultModel] = useState<string>('');
  const [modelList, setModelList] = useState<string[]>(DEFAULT_MODELS);

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
          <nav className="settings-sidebar">
            <button
              className={activeTab === 'general' ? 'active' : ''}
              onClick={() => setActiveTab('general')}
            >
              General
            </button>
            <button
              className={activeTab === 'api' ? 'active' : ''}
              onClick={() => setActiveTab('api')}
            >
              API Keys
            </button>
            <button
              className={activeTab === 'theme' ? 'active' : ''}
              onClick={() => setActiveTab('theme')}
            >
              Theme
            </button>
            <button
              className={activeTab === 'about' ? 'active' : ''}
              onClick={() => setActiveTab('about')}
            >
              About
            </button>
          </nav>
          <div className="settings-content">
          {isLoading ? (
            <div className="settings-loading">Loading settings...</div>
          ) : loadError ? (
            <div className="settings-error">{loadError}</div>
          ) : (
            <>
              {activeTab === 'general' && (
                <div className="settings-section">
                  <h3>General Settings</h3>
                  <div className="general-entry">
                    <label htmlFor="default-model">Default Model</label>
                    <select
                      id="default-model"
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
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'api' && (
            <div className="settings-section">
              <h3>API Providers</h3>
              
              {Object.entries(providers).map(([provider, apiKey]) => (
                <div key={provider} className="api-provider-entry">
                  <div className="provider-name">{provider}</div>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => handleProviderKeyChange(provider, e.target.value)}
                    placeholder="API Key"
                  />
                  <button 
                    className="remove-button"
                    onClick={() => handleRemoveProvider(provider)}
                  >
                    <span>×</span> Remove
                  </button>
                </div>
              ))}
              
              <div className="add-provider">
                <h4>Add New Provider</h4>
                <div className="add-provider-form">
                  <input
                    type="text"
                    value={newProvider.name}
                    onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })}
                    placeholder="Provider Name (e.g., OpenAI, Gemini)"
                  />
                  <input
                    type="password"
                    value={newProvider.key}
                    onChange={(e) => setNewProvider({ ...newProvider, key: e.target.value })}
                    placeholder="API Key"
                  />
                  <button onClick={handleAddProvider}><span>+</span> Add Provider</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'theme' && (
            <div className="settings-section">
              <h3>Theme Settings</h3>
              <p>Theme settings will be implemented in future versions.</p>
            </div>
          )}

          {activeTab === 'about' && (
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
