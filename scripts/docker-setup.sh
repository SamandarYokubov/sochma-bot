#!/bin/bash

# Docker Setup Script for Telegram Bot
# This script helps set up the Docker environment

set -e

echo "🐳 Setting up Docker environment for Telegram Bot..."

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

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.docker .env
    echo "⚠️  Please edit .env file and add your Telegram bot token!"
    echo "   You can get a token from @BotFather on Telegram"
    read -p "Press Enter to continue after updating .env file..."
fi

# Create logs directory
mkdir -p logs

# Build and start services
echo "🔨 Building Docker images..."
docker-compose build

echo "🚀 Starting services..."
docker-compose up -d

echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service health
echo "🔍 Checking service health..."
docker-compose ps

echo "✅ Setup complete!"
echo ""
echo "📊 Services running:"
echo "   - Telegram Bot: Check logs with 'docker-compose logs telegram-bot'"
echo "   - MongoDB: localhost:27017"
echo "   - Mongo Express: http://localhost:8081 (admin/admin123)"
echo ""
echo "📝 Useful commands:"
echo "   - View logs: docker-compose logs -f"
echo "   - Stop services: docker-compose down"
echo "   - Restart bot: docker-compose restart telegram-bot"
echo "   - Access MongoDB: docker-compose exec mongodb mongosh"
echo ""
echo "🎉 Your Telegram bot should now be running!"
