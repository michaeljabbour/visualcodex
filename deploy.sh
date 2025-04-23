#!/bin/bash

# Deploy script for VisualCodex

echo "Preparing VisualCodex for deployment..."

# Check if the application has been packaged
if [ ! -d "./release" ]; then
  echo "Error: Release directory not found. Please run './package.sh' first."
  exit 1
fi

# Create a zip archive of the source code
echo "Creating source code archive..."
zip -r visualcodex-source.zip src/ package.json tsconfig.json webpack.config.js README.md docs/ *.sh

# Create a directory for deployment assets
mkdir -p deploy

# Move the source code archive to the deploy directory
mv visualcodex-source.zip deploy/

# Copy the release files to the deploy directory
echo "Copying release files to deploy directory..."
cp -r release/* deploy/

# Create a deployment info file
cat > deploy/DEPLOYMENT.md << EOL
# VisualCodex Deployment

## Contents

This deployment package contains:

1. Pre-built applications for Windows, macOS, and Linux
2. Source code archive (visualcodex-source.zip)
3. Documentation

## Installation

Choose the appropriate installer for your platform:

- Windows: VisualCodex-Setup-*.exe
- macOS: VisualCodex-*.dmg
- Linux: VisualCodex-*.AppImage or VisualCodex-*.deb

## Requirements

- open-codex CLI must be installed and in your PATH
- Valid API keys for the AI providers you wish to use

## Getting Started

Please refer to the user guide in the documentation for detailed instructions on getting started with VisualCodex.

## Support

For support, please visit the GitHub repository or contact the developer.
EOL

echo "Deployment preparation completed successfully!"
echo "The deployment assets can be found in the 'deploy' directory."
echo "You can now upload these files to your preferred distribution platform."
