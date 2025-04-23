#!/bin/bash

# Run all tests for VisualCodex

echo "Running all tests for VisualCodex..."

# Run basic tests
echo "Running basic tests..."
./test.sh

if [ $? -ne 0 ]; then
  echo "Basic tests failed."
  exit 1
fi

echo "Basic tests passed."

# Run integration tests
echo "Running integration tests..."
./integration_test.sh

if [ $? -ne 0 ]; then
  echo "Integration tests failed."
  exit 1
fi

echo "Integration tests passed."

echo "All tests completed successfully!"
echo "You can now build the application with './build.sh'"
