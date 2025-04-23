# VisualCodex User Guide

## Introduction

VisualCodex is a modern Electron-based graphical user interface for open-codex, providing a user-friendly way to interact with AI coding assistants. This guide will help you get started with VisualCodex and make the most of its features.

## Installation

### Prerequisites
- Node.js (v20+)
- npm (v10+)
- open-codex CLI installed and in your PATH

### Installing VisualCodex
1. Download the appropriate installer for your operating system from the releases page.
2. Run the installer and follow the on-screen instructions.
3. Launch VisualCodex from your applications menu or desktop shortcut.

## Getting Started

### First Launch
When you first launch VisualCodex, you'll need to configure your API providers:

1. Click the "Settings" button in the bottom right corner.
2. Go to the "API Keys" tab.
3. Add your API keys for the providers you want to use (OpenAI, Gemini, etc.).
4. Click "Save" to store your settings.

### Interface Overview

The VisualCodex interface consists of several key areas:

- **Sidebar**: Displays your project files and allows for navigation.
- **Response Area**: Shows the AI assistant's responses and system messages.
- **Input Area**: Where you enter your prompts and commands.
- **Operations Panel**: Provides access to command execution and file operations.
- **Footer**: Contains controls for approval mode and model selection.

## Features

### Approval Modes

VisualCodex supports three approval modes:

- **Suggest**: The AI will suggest changes but won't make them automatically.
- **Auto Edit**: The AI will make changes automatically but will ask for approval for significant changes.
- **Full Auto**: The AI will make all changes automatically without asking for approval.

To change the approval mode, use the dropdown in the footer.

### Working with Files

The sidebar displays files in your current working directory. You can:

- Click on a folder to navigate into it
- Use the up arrow to navigate to the parent directory
- Click the refresh button to update the file list
- Click the folder button to select a different directory

### Command Execution

To execute commands:

1. Click "Show Operations" to display the operations panel.
2. Select the "Command Execution" tab.
3. Enter your command in the input field.
4. Click "Execute" to run the command.

Depending on your approval mode, you may need to approve the command before it executes.

### File Operations

To perform file operations:

1. Click "Show Operations" to display the operations panel.
2. Select the "File Operations" tab.
3. Enter the file path or use the "Browse" button to select a file.
4. Choose the operation (Read or Write).
5. For write operations, enter the content in the text area.
6. Click the operation button to perform the action.

### Using the AI Assistant

To interact with the AI assistant:

1. Type your prompt in the input area at the bottom of the screen.
2. Press Ctrl+Enter or click "Send" to submit your prompt.
3. The AI's response will appear in the response area.

## Troubleshooting

### API Key Issues
If you encounter errors related to API keys:
1. Check that you've entered the correct API key in Settings.
2. Verify that your API key has the necessary permissions.
3. Check your internet connection.

### Command Execution Problems
If commands fail to execute:
1. Ensure open-codex is properly installed and in your PATH.
2. Check that you have the necessary permissions for the command.
3. Verify that your working directory is set correctly.

### Application Crashes
If the application crashes:
1. Restart VisualCodex.
2. Check the logs in the application data directory.
3. Ensure your system meets the minimum requirements.

## Support

For additional help or to report issues, please visit the GitHub repository at [https://github.com/yourusername/visualcodex](https://github.com/yourusername/visualcodex).
