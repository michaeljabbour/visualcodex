#!/bin/bash

# Build script for VisualCodex

echo "Building VisualCodex..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the application
echo "Building application..."
npm run build

# Test if build was successful
if [ -d "./dist" ]; then
  echo "Build successful!"
else
  echo "Build failed!"
  exit 1
fi

echo "You can now run the application with 'npm start'"
