import React from 'react';

interface FooterProps {
  approvalMode: string;
  selectedModel: string;
  onApprovalModeChange: (mode: string) => void;
  onModelChange: (model: string) => void;
  onSettingsClick: () => void;
}

const Footer: React.FC<FooterProps> = ({
  approvalMode,
  selectedModel,
  onApprovalModeChange,
  onModelChange,
  onSettingsClick
}) => {
  return (
    <div className="footer">
      <div className="approval-mode">
        <label htmlFor="approval-mode">Approval: </label>
        <select
          id="approval-mode"
          className="dropdown"
          value={approvalMode}
          onChange={(e) => onApprovalModeChange(e.target.value)}
        >
          <option value="suggest">Suggest</option>
          <option value="auto-edit">Auto Edit</option>
          <option value="full-auto">Full Auto</option>
        </select>
      </div>
      
      <div className="model-selector">
        <label htmlFor="model">Model: </label>
        <select
          id="model"
          className="dropdown"
          value={selectedModel}
          onChange={(e) => onModelChange(e.target.value)}
        >
          <option value="gpt-4o">GPT-4o</option>
          <option value="gpt-4-turbo">GPT-4 Turbo</option>
          <option value="gemini-pro">Gemini Pro</option>
          <option value="claude-3-opus">Claude 3 Opus</option>
          <option value="local">Local Model</option>
        </select>
      </div>
      
      <button className="settings-button" onClick={onSettingsClick}>
        Settings
      </button>
    </div>
  );
};

export default Footer;
