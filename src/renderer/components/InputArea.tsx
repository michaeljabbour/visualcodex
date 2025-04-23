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
      
      // Fall back to 'none' approval mode if there are issues
      const safeApprovalMode = approvalMode === 'suggest' ? 'none' : approvalMode;
      console.log('Executing prompt with approval mode:', safeApprovalMode);
      const result = await window.api.executeOpenCodex(prompt, safeApprovalMode);
      console.log('Response received:', result.success ? 'Success' : 'Error');
      
      // Add response to response area
      if (window.addResponse) {
        if (result.success) {
          // Clean up JSON formatting and debug output from the response
          let cleanedOutput = result.output.trim();
          
          // Remove any JSON wrapper like {"result":"text","status":"success"}
          try {
            // Check if this is JSON with a result property
            if (cleanedOutput.startsWith('{') && cleanedOutput.endsWith('}')) {
              const jsonData = JSON.parse(cleanedOutput);
              if (jsonData.result) {
                cleanedOutput = jsonData.result;
              }
            }
          } catch (e) {
            // Not valid JSON, continue with the original output
            console.log('Failed to parse JSON in output:', e);
          }
          
          // Remove any "Using model:" lines
          cleanedOutput = cleanedOutput.replace(/Using model:.*\n?/g, '');
          
          window.addResponse('assistant', cleanedOutput || 'No output returned');
        } else if (result.output) {
          // If output exists but the command reported failure
          // This can happen with open-codex when it completes but returns non-zero
          window.addResponse('assistant', result.output.trim());
        } else {
          console.error('Command execution failed:', result.error);
          window.addResponse('error', result.error || 'Failed to process the prompt. Please try again.');
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
