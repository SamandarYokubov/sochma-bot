#!/bin/bash

# Sochma Bot Deployment Script for VPS
# This script automates the deployment process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN=""
BOT_TOKEN=""
MONGODB_URI=""
SOCHMA_API_URL=""
SOCHMA_API_KEY=""

# Functions
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

check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_error "This script should not be run as root for security reasons"
        exit 1
    fi
}

check_dependencies() {
    print_status "Checking dependencies..."
    
    # Check if running on supported OS
    if [[ ! -f /etc/os-release ]]; then
        print_error "Cannot determine OS version"
        exit 1
    fi
    
    source /etc/os-release
    if [[ "$ID" != "ubuntu" && "$ID" != "debian" && "$ID" != "centos" && "$ID" != "rhel" ]]; then
        print_warning "This script is optimized for Ubuntu/Debian/CentOS/RHEL"
    fi
    
    # Check if required commands exist
    local missing_deps=()
    
    if ! command -v node &> /dev/null; then
        missing_deps+=("nodejs")
    fi
    
    if ! command -v npm &> /dev/null; then
        missing_deps+=("npm")
    fi
    
    if ! command -v nginx &> /dev/null; then
        missing_deps+=("nginx")
    fi
    
    if ! command -v mongod &> /dev/null; then
        missing_deps+=("mongodb")
    fi
    
    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        print_error "Missing dependencies: ${missing_deps[*]}"
        print_status "Please install them first and run this script again"
        exit 1
    fi
    
    print_success "All dependencies are installed"
}

install_dependencies() {
    print_status "Installing system dependencies..."
    
    # Update package list
    sudo apt update
    
    # Install Node.js 18
    if ! command -v node &> /dev/null || [[ $(node -v | cut -d'v' -f2 | cut -d'.' -f1) -lt 18 ]]; then
        print_status "Installing Node.js 18..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
    
    # Install PM2
    if ! command -v pm2 &> /dev/null; then
        print_status "Installing PM2..."
        sudo npm install -g pm2
    fi
    
    # Install MongoDB
    if ! command -v mongod &> /dev/null; then
        print_status "Installing MongoDB..."
        wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
        echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
        sudo apt-get update
        sudo apt-get install -y mongodb-org
        
        # Start and enable MongoDB
        sudo systemctl start mongod
        sudo systemctl enable mongod
    fi
    
    # Install Nginx
    if ! command -v nginx &> /dev/null; then
        print_status "Installing Nginx..."
        sudo apt install -y nginx
        sudo systemctl start nginx
        sudo systemctl enable nginx
    fi
    
    # Install Certbot
    if ! command -v certbot &> /dev/null; then
        print_status "Installing Certbot..."
        sudo apt install -y certbot python3-certbot-nginx
    fi
    
    print_success "All dependencies installed"
}

setup_environment() {
    print_status "Setting up environment..."
    
    # Create application directory
    sudo mkdir -p /opt/sochma-bot
    sudo chown $USER:$USER /opt/sochma-bot
    
    # Copy application files
    cp -r . /opt/sochma-bot/
    cd /opt/sochma-bot
    
    # Install npm dependencies
    npm install --production
    
    # Create logs directory
    mkdir -p logs
    
    # Generate secrets if not provided
    if [[ -z "$JWT_SECRET" ]]; then
        JWT_SECRET=$(openssl rand -hex 32)
    fi
    
    if [[ -z "$ENCRYPTION_KEY" ]]; then
        ENCRYPTION_KEY=$(openssl rand -hex 32)
    fi
    
    # Create production .env file
    cat > .env << EOF
# Bot Configuration
BOT_TOKEN=${BOT_TOKEN}
BOT_USERNAME=${BOT_USERNAME}

# Database Configuration
MONGODB_URI=${MONGODB_URI:-mongodb://localhost:27017/sochma_bot}

# Application Configuration
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Sochma Platform API
SOCHMA_API_URL=${SOCHMA_API_URL:-https://api.sochma.com}
SOCHMA_API_KEY=${SOCHMA_API_KEY}

# Security
JWT_SECRET=${JWT_SECRET}
ENCRYPTION_KEY=${ENCRYPTION_KEY}

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=20

# Webhook Configuration
WEBHOOK_URL=https://${DOMAIN}/webhook
WEBHOOK_PORT=3000
WEBHOOK_CERT_PATH=/etc/letsencrypt/live/${DOMAIN}/fullchain.pem
WEBHOOK_KEY_PATH=/etc/letsencrypt/live/${DOMAIN}/privkey.pem
EOF
    
    print_success "Environment configured"
}

setup_ssl() {
    print_status "Setting up SSL certificate..."
    
    # Stop Nginx temporarily
    sudo systemctl stop nginx
    
    # Get SSL certificate
    sudo certbot certonly --standalone -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
    
    # Start Nginx
    sudo systemctl start nginx
    
    print_success "SSL certificate obtained"
}

setup_nginx() {
    print_status "Configuring Nginx..."
    
    # Replace domain in nginx config
    sed "s/yourdomain.com/$DOMAIN/g" nginx.conf > /tmp/sochma-bot-nginx.conf
    
    # Copy nginx configuration
    sudo cp /tmp/sochma-bot-nginx.conf /etc/nginx/sites-available/sochma-bot
    
    # Enable site
    sudo ln -sf /etc/nginx/sites-available/sochma-bot /etc/nginx/sites-enabled/
    
    # Remove default site
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Test nginx configuration
    sudo nginx -t
    
    # Reload nginx
    sudo systemctl reload nginx
    
    print_success "Nginx configured"
}

setup_firewall() {
    print_status "Configuring firewall..."
    
    # Install UFW if not present
    sudo apt install -y ufw
    
    # Configure firewall
    sudo ufw allow 22/tcp
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    sudo ufw --force enable
    
    print_success "Firewall configured"
}

start_bot() {
    print_status "Starting bot with PM2..."
    
    # Start bot with PM2
    pm2 start ecosystem.config.js --env production
    
    # Save PM2 configuration
    pm2 save
    
    # Setup PM2 startup
    pm2 startup
    
    print_success "Bot started with PM2"
}

set_webhook() {
    print_status "Setting webhook URL..."
    
    # Set webhook via Telegram API
    curl -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
         -H "Content-Type: application/json" \
         -d "{\"url\": \"https://${DOMAIN}/webhook\"}"
    
    # Verify webhook
    curl "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo"
    
    print_success "Webhook configured"
}

setup_monitoring() {
    print_status "Setting up monitoring..."
    
    # Create log rotation config
    sudo tee /etc/logrotate.d/sochma-bot > /dev/null << EOF
/opt/sochma-bot/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        pm2 reloadLogs
    endscript
}
EOF
    
    # Setup SSL certificate auto-renewal
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
    
    print_success "Monitoring configured"
}

# Main deployment function
deploy() {
    print_status "Starting Sochma Bot deployment..."
    
    # Get configuration from user
    read -p "Enter your domain name (e.g., bot.yourdomain.com): " DOMAIN
    read -p "Enter your Telegram bot token: " BOT_TOKEN
    read -p "Enter your bot username (without @): " BOT_USERNAME
    read -p "Enter MongoDB URI (press Enter for default): " MONGODB_URI
    read -p "Enter Sochma API URL (press Enter for default): " SOCHMA_API_URL
    read -p "Enter Sochma API key (optional): " SOCHMA_API_KEY
    
    # Validate inputs
    if [[ -z "$DOMAIN" || -z "$BOT_TOKEN" || -z "$BOT_USERNAME" ]]; then
        print_error "Domain, bot token, and bot username are required"
        exit 1
    fi
    
    # Run deployment steps
    check_root
    check_dependencies
    install_dependencies
    setup_environment
    setup_ssl
    setup_nginx
    setup_firewall
    start_bot
    set_webhook
    setup_monitoring
    
    print_success "Deployment completed successfully!"
    print_status "Your bot is now running at https://$DOMAIN"
    print_status "Webhook URL: https://$DOMAIN/webhook"
    print_status "Health check: https://$DOMAIN/health"
    
    echo ""
    print_status "Useful commands:"
    echo "  pm2 status                    # Check bot status"
    echo "  pm2 logs sochma-bot          # View bot logs"
    echo "  pm2 restart sochma-bot       # Restart bot"
    echo "  sudo nginx -t                # Test nginx config"
    echo "  sudo systemctl reload nginx  # Reload nginx"
}

# Run deployment
deploy
