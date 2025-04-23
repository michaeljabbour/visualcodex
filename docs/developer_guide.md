# Developer Documentation

## Architecture Overview

VisualCodex is built with a hybrid approach that extracts core logic from open-codex while reimplementing the UI layer using React for Electron. The application follows a standard Electron architecture with three main components:

1. **Main Process**: Handles Electron lifecycle, window management, and IPC communication
2. **Renderer Process**: Implements the React-based UI
3. **Preload Script**: Securely exposes IPC methods to the renderer process

### Directory Structure

```
visualcodex/
├── dist/                 # Compiled output
├── docs/                 # Documentation
├── mockups/              # UI mockups and design assets
├── node_modules/         # Dependencies
├── release/              # Packaged applications
├── src/                  # Source code
│   ├── main/             # Main process code
│   │   ├── main.ts       # Entry point for Electron
│   │   ├── preload.ts    # Preload script for IPC
│   │   └── open-codex-bridge.ts  # Bridge to open-codex
│   ├── renderer/         # Renderer process code
│   │   ├── components/   # React components
│   │   ├── styles/       # CSS styles
│   │   ├── index.html    # HTML template
│   │   └── renderer.tsx  # Entry point for React
│   └── shared/           # Shared code
│       └── types/        # TypeScript type definitions
├── .gitignore            # Git ignore file
├── build.sh              # Build script
├── integration_test.sh   # Integration test script
├── package.json          # npm package configuration
├── README.md             # Project README
├── run_tests.sh          # Test runner script
├── test.sh               # Basic test script
├── tsconfig.json         # TypeScript configuration
└── webpack.config.js     # Webpack configuration
```

## Main Process

The main process (`src/main/main.ts`) is responsible for:

- Creating and managing the application window
- Setting up IPC handlers for communication with the renderer process
- Managing application configuration using electron-store
- Integrating with open-codex through the bridge layer

### Configuration Management

VisualCodex uses electron-store to persist user configuration:

```typescript
const store = new ElectronStore({
  name: 'visualcodex-config',
  defaults: {
    apiProviders: {},
    approvalMode: 'suggest',
    defaultModel: 'gpt-4o',
    windowBounds: { width: 1200, height: 800 }
  }
});
```

### IPC Handlers

The main process sets up IPC handlers for:

- Configuration management
- API provider management
- Approval mode management
- Command execution
- File operations

## Renderer Process

The renderer process implements the UI using React. The main components are:

- **App**: The root component that manages the application state
- **Sidebar**: Displays project files and allows navigation
- **ResponseArea**: Shows AI assistant responses
- **InputArea**: Handles user input and prompt submission
- **OperationsTabs**: Contains command execution and file operation interfaces
- **Settings**: Manages API provider configuration

### State Management

The application uses React's useState and useEffect hooks for state management. Key state includes:

- Approval mode
- Selected model
- API providers
- UI state (settings open, operations visible, etc.)

### Component Communication

Components communicate through:

- Props for parent-child communication
- Custom events for cross-component communication
- IPC for communication with the main process

## Open-Codex Integration

The open-codex-bridge.ts file provides the integration layer between the Electron app and open-codex. It:

- Sets up IPC handlers for open-codex operations
- Executes commands through open-codex CLI
- Handles file operations
- Manages project files

### Command Execution

Commands are executed through the open-codex CLI using Node.js child_process:

```typescript
const openCodexProcess = spawn('open-codex', args, {
  env,
  cwd,
  shell: true
});
```

## Building and Packaging

The application uses webpack for building and electron-builder for packaging:

- **webpack**: Compiles TypeScript, bundles assets, and prepares the application for distribution
- **electron-builder**: Packages the application for Windows, macOS, and Linux

### Build Process

The build process:

1. Compiles TypeScript files
2. Bundles assets with webpack
3. Copies necessary files to the dist directory

### Packaging Process

The packaging process:

1. Builds the application
2. Creates installers for each platform
3. Places the packaged applications in the release directory

## Testing

VisualCodex includes several test scripts:

- **test.sh**: Basic tests for file existence and compilation
- **integration_test.sh**: Tests integration with open-codex
- **run_tests.sh**: Runs all tests sequentially

## Extending VisualCodex

### Adding New Features

To add new features:

1. Implement the feature in the appropriate component
2. Add any necessary IPC handlers in the main process
3. Update the bridge layer if needed
4. Add tests for the new feature

### Adding New AI Providers

To add support for new AI providers:

1. Update the Settings component to include the new provider
2. Add the necessary configuration in the main process
3. Update the bridge layer to handle the new provider

## Troubleshooting Development Issues

### Common Issues

- **IPC Communication Errors**: Ensure the preload script exposes all necessary methods
- **Build Failures**: Check webpack configuration and TypeScript errors
- **Integration Issues**: Verify open-codex is installed and accessible

### Debugging

- Use console.log in the renderer process
- Use electron-builder's debug mode for packaging issues
- Check the main process logs for IPC and bridge issues
