import React, { useState, useEffect } from 'react';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ApiProvider {
  name: string;
  key: string;
}

const Settings: React.FC<SettingsProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<string>('api');
  const [providers, setProviders] = useState<Record<string, string>>({});
  const [newProvider, setNewProvider] = useState<ApiProvider>({ name: '', key: '' });
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string>('');

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
    }
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

        <div className="settings-tabs">
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
        </div>

        <div className="settings-content">
          {activeTab === 'general' && (
            <div className="settings-section">
              <h3>General Settings</h3>
              <p>General settings will be implemented in future versions.</p>
            </div>
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
                    Remove
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
                  <button onClick={handleAddProvider}>Add</button>
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
