#!/bin/bash

# Webhook Setup Script for Telegram Bot
# This script helps set up webhook configuration

set -e

echo "🔗 Setting up Telegram Bot Webhook..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create one from env.example"
    exit 1
fi

# Source environment variables
source .env

# Check required variables
if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
    echo "❌ TELEGRAM_BOT_TOKEN is required"
    exit 1
fi

if [ -z "$WEBHOOK_DOMAIN" ]; then
    echo "❌ WEBHOOK_DOMAIN is required for webhook setup"
    exit 1
fi

# Set default values
WEBHOOK_PATH=${WEBHOOK_PATH:-/webhook}
WEBHOOK_PORT=${WEBHOOK_PORT:-3000}

echo "📋 Webhook Configuration:"
echo "   Domain: $WEBHOOK_DOMAIN"
echo "   Path: $WEBHOOK_PATH"
echo "   Port: $WEBHOOK_PORT"
echo "   Full URL: https://$WEBHOOK_DOMAIN$WEBHOOK_PATH"

# Test webhook URL accessibility
echo "🔍 Testing webhook URL accessibility..."
if curl -f -s "https://$WEBHOOK_DOMAIN/health" > /dev/null; then
    echo "✅ Webhook URL is accessible"
else
    echo "⚠️  Warning: Webhook URL may not be accessible yet"
    echo "   Make sure your server is running and accessible at https://$WEBHOOK_DOMAIN"
fi

# Set webhook via Telegram API
echo "🚀 Setting webhook via Telegram API..."
WEBHOOK_URL="https://$WEBHOOK_DOMAIN$WEBHOOK_PATH"

RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
    -d "url=$WEBHOOK_URL" \
    -d "drop_pending_updates=true")

if echo "$RESPONSE" | grep -q '"ok":true'; then
    echo "✅ Webhook set successfully!"
    echo "   URL: $WEBHOOK_URL"
else
    echo "❌ Failed to set webhook:"
    echo "$RESPONSE"
    exit 1
fi

# Get webhook info
echo "📊 Getting webhook information..."
curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getWebhookInfo" | jq '.'

echo ""
echo "🎉 Webhook setup completed!"
echo ""
echo "📝 Next steps:"
echo "   1. Make sure your bot is running with USE_WEBHOOK=true"
echo "   2. Ensure your domain has a valid SSL certificate"
echo "   3. Test the webhook by sending a message to your bot"
echo ""
echo "🔧 Useful commands:"
echo "   - Check webhook: curl https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getWebhookInfo"
echo "   - Delete webhook: curl -X POST https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/deleteWebhook"
echo "   - Health check: curl https://$WEBHOOK_DOMAIN/health"
