# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands
- `npm run dev` - Start the app in development mode (webpack watch + electron)
- `npm run build` - Build the app for production
- `npm run start` - Start the electron app
- `npm run package` - Package the app for distribution

## Code Style Guidelines
- **TypeScript**: Use strict typing with React functional components
- **Imports**: Group by dependency type (React, internal components, styles)
- **Naming**:
  - React components: PascalCase (e.g., `InputArea.tsx`)
  - Interfaces & types: PascalCase with prefix (e.g., `IConfig`, `TResponse`)
  - Variables & functions: camelCase
- **Error Handling**: Use try/catch blocks with specific error messages and logging
- **Components**: Use functional components with React hooks for state management
- **File Structure**:
  - Main process code in `src/main/`
  - Renderer process (UI) in `src/renderer/`
  - Shared types in `src/shared/types/`
- **Communication**: Use Electron IPC for main/renderer process communication
- **State Management**: Use React hooks (useState, useEffect) for component state