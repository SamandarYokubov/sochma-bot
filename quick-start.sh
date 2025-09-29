#!/bin/bash

echo "🤖 Sochma Bot Quick Start"
echo "========================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if MongoDB is running
if command -v mongod &> /dev/null; then
    if pgrep -x "mongod" > /dev/null; then
        echo "✅ MongoDB is running"
    else
        echo "⚠️  MongoDB is installed but not running"
        echo "   Start it with: brew services start mongodb-community (macOS)"
        echo "   Or: sudo systemctl start mongod (Linux)"
    fi
else
    echo "⚠️  MongoDB not found. Please install MongoDB:"
    echo "   - macOS: brew install mongodb-community"
    echo "   - Ubuntu: sudo apt install mongodb"
    echo "   - Or use MongoDB Atlas (cloud)"
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo ""
    echo "📝 No .env file found. Running setup wizard..."
    node setup.js
else
    echo "✅ .env file found"
fi

echo ""
echo "🚀 Starting the bot..."
echo "   Press Ctrl+C to stop"
echo ""

# Start the bot
npm run dev
