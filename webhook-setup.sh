#!/bin/bash

# Quick webhook setup script for Sochma Bot
# This script helps you set up webhooks on your VPS

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Get configuration
echo "🔗 Sochma Bot Webhook Setup"
echo "============================"
echo ""

read -p "Enter your domain name (e.g., bot.yourdomain.com): " DOMAIN
read -p "Enter your Telegram bot token: " BOT_TOKEN
read -p "Enter your bot username (without @): " BOT_USERNAME

# Validate inputs
if [[ -z "$DOMAIN" || -z "$BOT_TOKEN" || -z "$BOT_USERNAME" ]]; then
    print_error "Domain, bot token, and bot username are required"
    exit 1
fi

print_status "Setting up webhook for domain: $DOMAIN"

# Update .env file
print_status "Updating .env file..."
sed -i.bak "s|WEBHOOK_URL=.*|WEBHOOK_URL=https://$DOMAIN/webhook|g" .env
sed -i.bak "s|BOT_TOKEN=.*|BOT_TOKEN=$BOT_TOKEN|g" .env
sed -i.bak "s|BOT_USERNAME=.*|BOT_USERNAME=$BOT_USERNAME|g" .env
sed -i.bak "s|NODE_ENV=.*|NODE_ENV=production|g" .env

print_success ".env file updated"

# Set webhook URL via Telegram API
print_status "Setting webhook URL..."
WEBHOOK_RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
     -H "Content-Type: application/json" \
     -d "{\"url\": \"https://${DOMAIN}/webhook\"}")

if echo "$WEBHOOK_RESPONSE" | grep -q '"ok":true'; then
    print_success "Webhook URL set successfully"
else
    print_error "Failed to set webhook URL"
    echo "Response: $WEBHOOK_RESPONSE"
    exit 1
fi

# Verify webhook
print_status "Verifying webhook..."
WEBHOOK_INFO=$(curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo")
echo "Webhook info: $WEBHOOK_INFO"

# Test webhook endpoint
print_status "Testing webhook endpoint..."
HEALTH_RESPONSE=$(curl -s "https://${DOMAIN}/health")
if [[ $? -eq 0 ]]; then
    print_success "Webhook endpoint is accessible"
else
    print_warning "Could not reach webhook endpoint. Make sure your bot is running."
fi

print_success "Webhook setup completed!"
echo ""
print_status "Your webhook configuration:"
echo "  Domain: $DOMAIN"
echo "  Webhook URL: https://$DOMAIN/webhook"
echo "  Health Check: https://$DOMAIN/health"
echo "  Stats: https://$DOMAIN/stats"
echo ""
print_status "Next steps:"
echo "  1. Make sure your bot is running: pm2 status"
echo "  2. Check logs: pm2 logs sochma-bot"
echo "  3. Test your bot by sending /start command"
echo ""
print_status "Useful commands:"
echo "  pm2 restart sochma-bot    # Restart bot"
echo "  pm2 logs sochma-bot      # View logs"
echo "  curl https://$DOMAIN/health  # Health check"
