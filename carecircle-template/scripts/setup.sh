#!/bin/bash

# CareCircle Setup Script (Unix/Linux/Mac)

echo "🚀 Starting CareCircle Setup..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed."
    echo "Please install Node.js v18 or higher from https://nodejs.org/"
    exit 1
fi

# Run the Node.js setup script
node scripts/setup.js
