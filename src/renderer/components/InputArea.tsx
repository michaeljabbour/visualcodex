import React, { useState, useRef, useEffect } from 'react';
import '../styles/input-area.css';

interface InputAreaProps {}

const InputArea: React.FC<InputAreaProps> = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };

  const handleSubmit = async () => {
    if (!prompt.trim() || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      // Add user prompt to response area
      if (window.addResponse) {
        window.addResponse('user', prompt);
      }
      
      // Get the current approval mode
      const approvalMode = await window.api.getApprovalMode();
      
      // Execute the prompt through open-codex
      const result = await window.api.executeOpenCodex(prompt, approvalMode);
      
      // Add response to response area
      if (window.addResponse) {
        if (result.success) {
          window.addResponse('assistant', result.output);
        } else {
          window.addResponse('error', `Error: ${result.error || 'Failed to execute prompt'}\n\n${result.output || ''}`);
        }
      }
    } catch (error) {
      console.error('Failed to execute prompt:', error);
      if (window.addResponse) {
        window.addResponse('error', `Error: Failed to execute prompt. ${error}`);
      }
    } finally {
      setIsProcessing(false);
      setPrompt('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [prompt]);

  return (
    <div className="input-area">
      <textarea
        ref={textareaRef}
        value={prompt}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder="Enter your prompt here... (Ctrl+Enter to submit)"
        rows={3}
        disabled={isProcessing}
      />
      <div className="input-actions">
        <button 
          onClick={handleSubmit}
          disabled={isProcessing || !prompt.trim()}
          className={isProcessing ? 'processing' : ''}
        >
          {isProcessing ? 'Processing...' : 'Send'}
        </button>
      </div>
    </div>
  );
};

export default InputArea;
