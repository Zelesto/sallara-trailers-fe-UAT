#!/bin/bash
# scripts/run-update.sh
# Quick update script with less output

set -e

echo "🚀 Starting quick update..."

# Pull latest
git pull origin main

# Update dependencies
npm update --save

# Run import manager
node scripts/manage-imports.js

# Install any missing
npm install

# Build to verify
npm run build

echo "✅ Update complete!"