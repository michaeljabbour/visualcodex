#!/bin/bash

# Test script for VisualCodex

echo "Running tests for VisualCodex..."

# Check if node_modules exists
if [ ! -d "./node_modules" ]; then
  echo "Error: node_modules not found. Please run 'npm install' first."
  exit 1
fi

# Check if all required files exist
echo "Checking required files..."

REQUIRED_FILES=(
  "src/main/main.ts"
  "src/main/preload.ts"
  "src/main/open-codex-bridge.ts"
  "src/renderer/renderer.tsx"
  "src/renderer/index.html"
  "src/renderer/components/App.tsx"
  "webpack.config.js"
  "package.json"
  "tsconfig.json"
)

for file in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo "Error: Required file $file not found."
    exit 1
  fi
done

echo "All required files exist."

# Check TypeScript compilation
echo "Checking TypeScript compilation..."
npx tsc --noEmit

if [ $? -ne 0 ]; then
  echo "TypeScript compilation failed."
  exit 1
fi

echo "TypeScript compilation successful."

# Check webpack build
echo "Testing webpack build..."
npx webpack --mode development

if [ $? -ne 0 ]; then
  echo "Webpack build failed."
  exit 1
fi

echo "Webpack build successful."

echo "All tests passed!"
echo "You can now run the application with 'npm start'"
