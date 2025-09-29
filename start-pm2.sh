#!/bin/bash

# Start Sochma Bot with PM2
# This script handles the ES module compatibility issues

echo "🚀 Starting Sochma Bot with PM2..."

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 is not installed. Installing PM2..."
    npm install -g pm2
fi

# Create logs directory if it doesn't exist
mkdir -p logs

# Stop any existing processes
echo "🛑 Stopping existing processes..."
pm2 stop sochma-bot 2>/dev/null || true
pm2 delete sochma-bot 2>/dev/null || true

# Start the bot using the .cjs config file
echo "▶️  Starting bot with PM2..."
pm2 start ecosystem.config.cjs --env production

# Save PM2 configuration
pm2 save

# Show status
echo "📊 Bot Status:"
pm2 status

echo ""
echo "✅ Sochma Bot started successfully!"
echo ""
echo "Useful commands:"
echo "  pm2 status                    # Check bot status"
echo "  pm2 logs sochma-bot          # View bot logs"
echo "  pm2 restart sochma-bot       # Restart bot"
echo "  pm2 stop sochma-bot          # Stop bot"
echo "  pm2 monit                    # Monitor resources"
echo ""
echo "📝 Logs are stored in:"
echo "  - ./logs/combined.log"
echo "  - ./logs/err.log"
echo "  - ./logs/out.log"
