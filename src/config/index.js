require('dotenv').config();

const config = {
  // Bot Configuration
  bot: {
    token: process.env.TELEGRAM_BOT_TOKEN,
    name: process.env.BOT_NAME || 'HelloWorldBot',
    username: process.env.BOT_USERNAME || 'helloworld_bot'
  },
  
  // Environment
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  
  // Webhook Configuration
  webhook: {
    domain: process.env.WEBHOOK_DOMAIN,
    path: process.env.WEBHOOK_PATH || '/webhook',
    port: process.env.WEBHOOK_PORT || process.env.PORT || 3000,
    enabled: process.env.USE_WEBHOOK === 'true'
  },
  
  // MongoDB Configuration
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/telegram_bot',
    database: process.env.MONGODB_DATABASE || 'telegram_bot',
    options: {
      // Modern MongoDB driver options
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }
  },
  
  // Memory Storage Settings
  storage: {
    maxUsers: 1000, // Maximum number of users to store in memory
    cleanupInterval: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    useMongoDB: true, // Enable MongoDB storage
    syncInterval: 5 * 60 * 1000, // Sync with MongoDB every 5 minutes
  }
};

// Validation
if (!config.bot.token) {
  throw new Error('TELEGRAM_BOT_TOKEN is required. Please set it in your .env file.');
}

module.exports = config;
