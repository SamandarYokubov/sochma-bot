 # 🔗 Webhook Setup Guide for VPS with Nginx

This guide will help you configure webhooks for your Sochma Bot on a VPS server with Nginx.

## 📋 Prerequisites

- VPS server with root/sudo access
- Nginx installed and running
- Domain name pointing to your server
- SSL certificate (Let's Encrypt recommended)
- Node.js 18+ installed on your server

## 🚀 Step-by-Step Setup

### Step 1: Prepare Your Server

#### Install Node.js (if not already installed)
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
```

#### Install PM2 for process management
```bash
sudo npm install -g pm2
```

### Step 2: Deploy Your Bot

#### Upload your bot code to the server
```bash
# From your local machine
scp -r /path/to/sochma-bot user@your-server-ip:/opt/
```

#### On your server
```bash
# Navigate to your bot directory
cd /opt/sochma-bot

# Install dependencies
npm install --production

# Create logs directory
mkdir -p logs

# Set proper permissions
sudo chown -R $USER:$USER /opt/sochma-bot
chmod +x setup.js quick-start.sh
```

### Step 3: Configure Environment Variables

#### Create production .env file
```bash
nano .env
```

#### Production .env configuration
```env
# Bot Configuration
BOT_TOKEN=your_telegram_bot_token_here
BOT_USERNAME=your_bot_username

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/sochma_bot

# Application Configuration
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Sochma Platform API
SOCHMA_API_URL=https://api.sochma.com
SOCHMA_API_KEY=your_api_key_here

# Security
JWT_SECRET=your_jwt_secret_here
ENCRYPTION_KEY=your_encryption_key_here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=20

# Webhook Configuration
WEBHOOK_URL=https://yourdomain.com/webhook
WEBHOOK_PORT=3000
WEBHOOK_CERT_PATH=/etc/ssl/certs/yourdomain.com.pem
WEBHOOK_KEY_PATH=/etc/ssl/private/yourdomain.com.key
```

### Step 4: Install and Configure MongoDB

#### Install MongoDB
```bash
# Ubuntu/Debian
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start and enable MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### Step 5: SSL Certificate Setup

#### Install Certbot for Let's Encrypt
```bash
# Ubuntu/Debian
sudo apt install certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install certbot python3-certbot-nginx
```

#### Get SSL certificate
```bash
sudo certbot --nginx -d yourdomain.com
```

### Step 6: Configure Nginx

#### Create Nginx configuration
```bash
sudo nano /etc/nginx/sites-available/sochma-bot
```

#### Nginx configuration file
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Webhook endpoint
    location /webhook {
        proxy_pass http://localhost:3000/webhook;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Telegram webhook specific settings
        proxy_read_timeout 30s;
        proxy_connect_timeout 10s;
        proxy_send_timeout 10s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3000/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Stats endpoint (optional, for monitoring)
    location /stats {
        proxy_pass http://localhost:3000/stats;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Block access to sensitive files
    location ~ /\. {
        deny all;
    }
    
    location ~ \.(env|log)$ {
        deny all;
    }
}
```

#### Enable the site
```bash
sudo ln -s /etc/nginx/sites-available/sochma-bot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 7: Create PM2 Configuration

#### Create PM2 ecosystem file
```bash
nano ecosystem.config.js
```

#### PM2 ecosystem configuration
```javascript
module.exports = {
  apps: [{
    name: 'sochma-bot',
    script: 'src/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
```

### Step 8: Start Your Bot

#### Start with PM2
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### Check status
```bash
pm2 status
pm2 logs sochma-bot
```

### Step 9: Set Webhook URL

#### Set webhook via Telegram API
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://yourdomain.com/webhook"}'
```

#### Verify webhook is set
```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

## 🔧 Additional Configuration

### Firewall Setup

#### Configure UFW (Ubuntu)
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

#### Configure firewalld (CentOS/RHEL)
```bash
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### SSL Certificate Auto-renewal

#### Add to crontab
```bash
sudo crontab -e
```

#### Add this line
```bash
0 12 * * * /usr/bin/certbot renew --quiet
```

### Monitoring and Logs

#### View logs
```bash
# PM2 logs
pm2 logs sochma-bot

# Application logs
tail -f logs/combined.log
tail -f logs/error.log

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

#### Monitor system resources
```bash
pm2 monit
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Webhook not receiving updates
```bash
# Check if webhook is set correctly
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"

# Check Nginx configuration
sudo nginx -t

# Check if bot is running
pm2 status
```

#### 2. SSL certificate issues
```bash
# Test SSL certificate
openssl s_client -connect yourdomain.com:443

# Renew certificate manually
sudo certbot renew
```

#### 3. Bot not responding
```bash
# Check bot logs
pm2 logs sochma-bot

# Restart bot
pm2 restart sochma-bot

# Check database connection
mongo --eval "db.adminCommand('ping')"
```

#### 4. Nginx errors
```bash
# Check Nginx status
sudo systemctl status nginx

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Debug Commands

#### Test webhook endpoint
```bash
curl -X POST https://yourdomain.com/webhook \
     -H "Content-Type: application/json" \
     -d '{"test": "data"}'
```

#### Check bot health
```bash
curl https://yourdomain.com/health
```

#### View system resources
```bash
htop
df -h
free -h
```

## 🔒 Security Best Practices

1. **Keep system updated**
   ```bash
   sudo apt update && sudo apt upgrade
   ```

2. **Configure fail2ban**
   ```bash
   sudo apt install fail2ban
   sudo systemctl enable fail2ban
   ```

3. **Regular backups**
   ```bash
   # Backup MongoDB
   mongodump --db sochma_bot --out /backup/$(date +%Y%m%d)
   
   # Backup bot code
   tar -czf /backup/sochma-bot-$(date +%Y%m%d).tar.gz /opt/sochma-bot
   ```

4. **Monitor logs regularly**
   ```bash
   # Set up log rotation
   sudo nano /etc/logrotate.d/sochma-bot
   ```

## 📊 Performance Optimization

### Nginx Optimization
```nginx
# Add to server block
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

# Connection limits
limit_conn_zone $binary_remote_addr zone=conn_limit_per_ip:10m;
limit_req_zone $binary_remote_addr zone=req_limit_per_ip:10m rate=5r/s;

# Apply limits
limit_conn conn_limit_per_ip 10;
limit_req zone=req_limit_per_ip burst=10 nodelay;
```

### PM2 Optimization
```javascript
// In ecosystem.config.js
{
  instances: 'max', // Use all CPU cores
  exec_mode: 'cluster',
  max_memory_restart: '500M',
  node_args: '--max-old-space-size=500'
}
```

## ✅ Verification Checklist

- [ ] Domain points to your server
- [ ] SSL certificate is valid
- [ ] Nginx is running and configured
- [ ] MongoDB is running
- [ ] Bot is running with PM2
- [ ] Webhook is set correctly
- [ ] Firewall is configured
- [ ] Logs are being generated
- [ ] Health check endpoint responds
- [ ] Bot responds to messages

Your webhook setup is now complete! 🎉
