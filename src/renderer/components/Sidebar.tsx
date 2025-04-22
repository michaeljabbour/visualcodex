import React, { useState, useEffect } from 'react';
import '../styles/sidebar.css';

interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  modified: Date;
}

const Sidebar: React.FC = () => {
  const [currentDirectory, setCurrentDirectory] = useState<string>(process.cwd());
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFiles(currentDirectory);
  }, [currentDirectory]);

  const loadFiles = async (dirPath: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await window.api.getProjectFiles(dirPath);
      
      if (result.success) {
        setFiles(result.files);
      } else {
        setError(result.error || 'Failed to load files');
        setFiles([]);
      }
    } catch (error) {
      console.error('Failed to load files:', error);
      setError('Failed to load files');
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileClick = (file: FileItem) => {
    if (file.isDirectory) {
      setCurrentDirectory(file.path);
    }
  };

  const navigateUp = () => {
    const parentDir = currentDirectory.split('/').slice(0, -1).join('/');
    if (parentDir) {
      setCurrentDirectory(parentDir);
    }
  };

  const refreshFiles = () => {
    loadFiles(currentDirectory);
  };

  const selectDirectory = async () => {
    try {
      const result = await window.api.selectDirectory();
      if (!result.canceled) {
        setCurrentDirectory(result.directory);
      }
    } catch (error) {
      console.error('Failed to select directory:', error);
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Project Files</h2>
        <div className="sidebar-actions">
          <button onClick={refreshFiles} title="Refresh">↻</button>
          <button onClick={selectDirectory} title="Select Directory">📁</button>
        </div>
      </div>
      
      <div className="current-directory">
        <button onClick={navigateUp} title="Go Up">⬆️</button>
        <span title={currentDirectory}>{currentDirectory}</span>
      </div>
      
      <div className="file-list">
        {isLoading ? (
          <div className="loading">Loading files...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : files.length === 0 ? (
          <div className="empty">No files found</div>
        ) : (
          files.map((file, index) => (
            <div 
              key={index} 
              className={`file-item ${file.isDirectory ? 'directory' : 'file'}`}
              onClick={() => handleFileClick(file)}
            >
              <span className="file-icon">{file.isDirectory ? '📁' : '📄'}</span>
              <span className="file-name" title={file.name}>{file.name}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Sidebar;
