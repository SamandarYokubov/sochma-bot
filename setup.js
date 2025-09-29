#!/usr/bin/env node

import readline from 'readline';
import fs from 'fs';
import crypto from 'crypto';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setup() {
  console.log('🤖 Sochma Bot Setup Wizard\n');
  console.log('This will help you configure your bot environment.\n');

  // Check if .env exists
  if (fs.existsSync('.env')) {
    const overwrite = await question('⚠️  .env file already exists. Overwrite? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Setup cancelled.');
      rl.close();
      return;
    }
  }

  console.log('📋 Required Information:\n');

  // Bot Configuration
  const botToken = await question('1. Telegram Bot Token (from @BotFather): ');
  const botUsername = await question('2. Bot Username (without @): ');

  // Database Configuration
  console.log('\n🗄️  Database Configuration:');
  console.log('Options:');
  console.log('  - Local: mongodb://localhost:27017/sochma_bot');
  console.log('  - Atlas: mongodb+srv://username:password@cluster.mongodb.net/sochma_bot');
  console.log('  - Docker: mongodb://localhost:27017/sochma_bot');
  
  const mongodbUri = await question('3. MongoDB URI: ');

  // Sochma API Configuration
  const sochmaApiUrl = await question('4. Sochma API URL (default: https://api.sochma.com): ') || 'https://api.sochma.com';
  const sochmaApiKey = await question('5. Sochma API Key: ');

  // Generate secure secrets
  const jwtSecret = crypto.randomBytes(32).toString('hex');
  const encryptionKey = crypto.randomBytes(32).toString('hex');

  // Environment configuration
  const envConfig = `# Bot Configuration
BOT_TOKEN=${botToken}
BOT_USERNAME=${botUsername}

# Database Configuration
MONGODB_URI=${mongodbUri}
MONGODB_OPTIONS={"useNewUrlParser": true, "useUnifiedTopology": true}

# Application Configuration
NODE_ENV=development
PORT=3000
LOG_LEVEL=info

# Sochma Platform API
SOCHMA_API_URL=${sochmaApiUrl}
SOCHMA_API_KEY=${sochmaApiKey}

# Security (Auto-generated)
JWT_SECRET=${jwtSecret}
ENCRYPTION_KEY=${encryptionKey}

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=20

# Webhook Configuration (for production)
WEBHOOK_URL=
WEBHOOK_PORT=8443
WEBHOOK_CERT_PATH=
WEBHOOK_KEY_PATH=
`;

  // Write .env file
  fs.writeFileSync('.env', envConfig);

  console.log('\n✅ Configuration saved to .env file!');
  console.log('\n🔐 Security notes:');
  console.log('- JWT_SECRET and ENCRYPTION_KEY have been auto-generated');
  console.log('- Keep your .env file secure and never commit it to version control');
  
  console.log('\n🚀 Next steps:');
  console.log('1. Make sure MongoDB is running');
  console.log('2. Run: npm run dev (for development)');
  console.log('3. Test your bot by sending /start to it on Telegram');
  
  rl.close();
}

setup().catch(console.error);
