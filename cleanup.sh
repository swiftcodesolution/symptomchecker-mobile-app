#!/bin/bash

echo "Cleaning up React Native project..."

# Remove node_modules and package-lock.json
rm -rf node_modules
rm -f package-lock.json

# Clear Metro cache
npx expo start --clear

# Reinstall dependencies
npm install

echo "Cleanup complete! You can now run 'npx expo start' to test the app." 