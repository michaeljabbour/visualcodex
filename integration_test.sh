#!/bin/bash

# Integration test script for VisualCodex

echo "Running integration tests for VisualCodex..."

# Check if open-codex is installed
if ! command -v open-codex &> /dev/null; then
    echo "Warning: open-codex command not found. Integration tests may fail."
    echo "Please ensure open-codex is installed and in your PATH."
fi

# Test API key configuration
echo "Testing API key configuration..."
mkdir -p test_output

# Create a test configuration
cat > test_config.json << EOL
{
  "apiProviders": {
    "OpenAI": "test_key_openai",
    "Gemini": "test_key_gemini"
  },
  "approvalMode": "suggest",
  "defaultModel": "gpt-4o"
}
EOL

echo "Test configuration created."

# Test file operations
echo "Testing file operations..."
echo "Test content" > test_file.txt
if [ -f "test_file.txt" ]; then
    echo "File creation successful."
else
    echo "Error: File creation failed."
    exit 1
fi

# Clean up test files
echo "Cleaning up test files..."
rm -f test_file.txt test_config.json
rm -rf test_output

echo "Integration tests completed."
echo "Note: Full integration testing requires running the application."
echo "Please run 'npm start' to manually test the application functionality."
