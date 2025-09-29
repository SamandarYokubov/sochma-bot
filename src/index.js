import BotController from './controllers/botController.js';
import { config } from './config/index.js';
import logger from './utils/logger.js';

// Create bot controller instance
const botController = new BotController();

// Main function to start the bot
async function main() {
  try {
    logger.info('🚀 Starting Sochma Bot Application...');
    
    // Initialize the bot
    await botController.initialize();
    
    // Start the bot
    await botController.start();
    
    // Log startup information
    logger.info('✅ Sochma Bot is now running!');
    logger.info(`📊 Environment: ${config.app.env}`);
    logger.info(`🤖 Bot Username: @${config.bot.username}`);
    logger.info(`📡 Mode: ${config.webhook.url ? 'Webhook' : 'Polling'}`);
    
  } catch (error) {
    logger.error('❌ Failed to start Sochma Bot:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  try {
    await botController.stop('SIGTERM');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  try {
    await botController.stop('SIGINT');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
});

// Start the application
main();
