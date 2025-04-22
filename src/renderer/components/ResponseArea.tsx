import React, { useState, useEffect } from 'react';
import '../styles/response-area.css';

interface ResponseAreaProps {}

const ResponseArea: React.FC<ResponseAreaProps> = () => {
  const [responses, setResponses] = useState<Array<{type: string, content: string}>>([
    {
      type: 'system',
      content: 'Welcome to VisualCodex!\nEnter a prompt below to get started with the coding assistant.'
    }
  ]);

  // Function to add a new response
  const addResponse = (type: string, content: string) => {
    setResponses(prev => [...prev, { type, content }]);
  };

  // Function to clear all responses
  const clearResponses = () => {
    setResponses([{
      type: 'system',
      content: 'Responses cleared.'
    }]);
  };

  // Expose these functions to parent components
  useEffect(() => {
    // This would be implemented with a proper event system in a real app
    window.addResponse = addResponse;
    window.clearResponses = clearResponses;

    return () => {
      delete window.addResponse;
      delete window.clearResponses;
    };
  }, []);

  return (
    <div className="response-area">
      <div className="response-header">
        <h2>Responses</h2>
        <button onClick={clearResponses} className="clear-button">Clear</button>
      </div>
      <div className="response-content">
        {responses.map((response, index) => (
          <div key={index} className={`response-item ${response.type}`}>
            <pre>{response.content}</pre>
          </div>
        ))}
      </div>
    </div>
  );
};

// Add these to the Window interface
declare global {
  interface Window {
    addResponse: (type: string, content: string) => void;
    clearResponses: () => void;
  }
}

export default ResponseArea;
