#!/bin/bash

# Package script for VisualCodex

echo "Packaging VisualCodex for distribution..."

# Check if the application has been built
if [ ! -d "./dist" ]; then
  echo "Error: Build directory not found. Please run './build.sh' first."
  exit 1
fi

# Install electron-builder if not already installed
if ! npm list -g electron-builder > /dev/null 2>&1; then
  echo "Installing electron-builder..."
  npm install -g electron-builder
fi

# Create release directory if it doesn't exist
mkdir -p release

# Package for all platforms
echo "Packaging for Windows, macOS, and Linux..."
npm run package

if [ $? -ne 0 ]; then
  echo "Packaging failed."
  exit 1
fi

echo "Packaging completed successfully!"
echo "The packaged applications can be found in the 'release' directory."
