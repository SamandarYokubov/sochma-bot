#!/bin/bash

# Docker Development Script for Telegram Bot
# This script sets up a development environment with MongoDB only

set -e

echo "🛠️  Setting up Docker development environment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create .env file for development if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file for development..."
    cat > .env << EOF
# Development Environment Configuration
TELEGRAM_BOT_TOKEN=7682805220:AAHOMsfGVX7OxkI01Qu0OztfG8VKJqWLcfM
BOT_NAME=sochma_bot
BOT_USERNAME=sochmabot
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27018/telegram_bot_dev
MONGODB_DATABASE=telegram_bot_dev
EOF
    echo "⚠️  Please edit .env file and add your Telegram bot token!"
fi

# Start only MongoDB for development
echo "🚀 Starting MongoDB for development..."
docker-compose -f docker-compose.dev.yml up -d

echo "⏳ Waiting for MongoDB to be ready..."
sleep 10

# Check service health
echo "🔍 Checking MongoDB health..."
docker-compose -f docker-compose.dev.yml ps

echo "✅ Development environment ready!"
echo ""
echo "📊 Services running:"
echo "   - MongoDB: localhost:27018"
echo "   - Mongo Express: http://localhost:8082"
echo ""
echo "🚀 Now you can run the bot locally:"
echo "   npm install"
echo "   npm run dev"
echo ""
echo "📝 Useful commands:"
echo "   - View MongoDB logs: docker-compose -f docker-compose.dev.yml logs mongodb"
echo "   - Stop MongoDB: docker-compose -f docker-compose.dev.yml down"
echo "   - Access MongoDB: docker-compose -f docker-compose.dev.yml exec mongodb mongosh"
echo ""
echo "🎉 Development environment is ready!"
