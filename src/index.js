const config = require('./config');
const Logger = require('./utils/logger');
const BotService = require('./services/botService');
const databaseService = require('./services/database');
const memoryStorage = require('./services/memoryStorage');

class Application {
  constructor() {
    this.botService = new BotService();
    this.isShuttingDown = false;
  }

  /**
   * Start the application
   */
  async start() {
    try {
      Logger.info('Starting Telegram Bot Application', {
        env: config.env,
        botName: config.bot.name
      });

      // Connect to MongoDB if enabled
      if (config.storage.useMongoDB) {
        await databaseService.connect();
        await memoryStorage.loadUsersFromMongoDB();
        Logger.info('MongoDB connection established');
      }

      // Start the bot
      await this.botService.start();

      // Set up graceful shutdown
      this.setupGracefulShutdown();

      Logger.info('Application started successfully');
    } catch (error) {
      Logger.error('Failed to start application', { error: error.message });
      process.exit(1);
    }
  }

  /**
   * Set up graceful shutdown handlers
   */
  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      if (this.isShuttingDown) {
        Logger.warn('Shutdown already in progress');
        return;
      }

      this.isShuttingDown = true;
      Logger.info(`Received ${signal}, shutting down gracefully...`);

      try {
        // Stop the bot
        await this.botService.stop();
        
        // Disconnect from MongoDB
        if (config.storage.useMongoDB) {
          await databaseService.disconnect();
        }
        
        Logger.info('Application stopped successfully');
        process.exit(0);
      } catch (error) {
        Logger.error('Error during shutdown', { error: error.message });
        process.exit(1);
      }
    };

    // Handle different termination signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGUSR2', () => shutdown('SIGUSR2')); // For nodemon

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      Logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      Logger.error('Unhandled Rejection', { reason: reason?.message || reason, promise });
      process.exit(1);
    });
  }
}

// Start the application
const app = new Application();
app.start().catch((error) => {
  Logger.error('Failed to start application', { error: error.message });
  process.exit(1);
});
