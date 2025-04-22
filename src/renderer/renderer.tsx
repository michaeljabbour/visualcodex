import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './components/App';
import './styles/global.css';
import './styles/theme.css';
import './styles/enhancements.css';

// Add error handling for the renderer process
console.log('Renderer script starting...');

try {
  // Check if the API is available
  if (!window.api) {
    console.error('API not available in renderer. Preload script may not be loaded correctly.');
    // Display error directly in the DOM before React renders
    document.body.innerHTML = `
      <div style="padding: 20px; color: red; font-family: sans-serif;">
        <h2>Error: API Not Available</h2>
        <p>The application could not initialize properly. The preload script may not be loaded correctly.</p>
        <p>Please check the console for more details or restart the application.</p>
      </div>
    `;
  } else {
    console.log('API is available in renderer, proceeding with React initialization');
    
    // Create root element and render the App
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      throw new Error('Root element not found in the DOM');
    }
    
    console.log('Root element found, creating React root');
    const root = ReactDOM.createRoot(rootElement);
    
    console.log('Rendering React application');
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    
    console.log('React render completed');
  }
} catch (error) {
  console.error('Error in renderer initialization:', error);
  // Display error directly in the DOM
  document.body.innerHTML = `
    <div style="padding: 20px; color: red; font-family: sans-serif;">
      <h2>Application Error</h2>
      <p>An error occurred while initializing the application:</p>
      <pre style="background: #f8f8f8; padding: 10px; border-radius: 5px; overflow: auto;">${error instanceof Error ? error.message : String(error)}</pre>
      <p>Please check the console for more details or restart the application.</p>
    </div>
  `;
}
