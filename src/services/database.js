import mongoose from 'mongoose';
import { config } from '../config/index.js';
import logger from '../utils/logger.js';

class DatabaseService {
  constructor() {
    this.isConnected = false;
    this.connection = null;
  }

  async connect() {
    try {
      if (this.isConnected) {
        logger.info('Database already connected');
        return;
      }

      logger.info('Connecting to MongoDB...');
      
      this.connection = await mongoose.connect(config.database.uri, config.database.options);
      this.isConnected = true;
      
      logger.info('Successfully connected to MongoDB');
      
      // Handle connection events
      mongoose.connection.on('error', (error) => {
        logger.error('MongoDB connection error:', error);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected');
        this.isConnected = true;
      });

      // Graceful shutdown
      process.on('SIGINT', this.gracefulShutdown.bind(this));
      process.on('SIGTERM', this.gracefulShutdown.bind(this));

    } catch (error) {
      logger.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.connection) {
        await mongoose.disconnect();
        this.isConnected = false;
        logger.info('Disconnected from MongoDB');
      }
    } catch (error) {
      logger.error('Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  async gracefulShutdown() {
    logger.info('Received shutdown signal, closing MongoDB connection...');
    try {
      await this.disconnect();
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    };
  }

  async healthCheck() {
    try {
      if (!this.isConnected) {
        return { status: 'disconnected', message: 'Database not connected' };
      }

      // Ping the database
      await mongoose.connection.db.admin().ping();
      
      return {
        status: 'healthy',
        message: 'Database connection is healthy',
        ...this.getConnectionStatus()
      };
    } catch (error) {
      logger.error('Database health check failed:', error);
      return {
        status: 'unhealthy',
        message: error.message,
        ...this.getConnectionStatus()
      };
    }
  }

  // Utility methods for common operations
  async createIndexes() {
    try {
      logger.info('Creating database indexes...');
      
      // Import models to ensure indexes are created
      const User = (await import('../models/User.js')).default;
      const Conversation = (await import('../models/Conversation.js')).default;
      
      // Create indexes for User model
      await User.createIndexes();
      
      // Create indexes for Conversation model
      await Conversation.createIndexes();
      
      logger.info('Database indexes created successfully');
    } catch (error) {
      logger.error('Error creating database indexes:', error);
      throw error;
    }
  }

  async clearTestData() {
    if (config.app.env !== 'test') {
      throw new Error('clearTestData can only be called in test environment');
    }

    try {
      logger.info('Clearing test data...');
      
      const User = (await import('../models/User.js')).default;
      const Conversation = (await import('../models/Conversation.js')).default;
      
      await User.deleteMany({});
      await Conversation.deleteMany({});
      
      logger.info('Test data cleared successfully');
    } catch (error) {
      logger.error('Error clearing test data:', error);
      throw error;
    }
  }
}

// Create singleton instance
const databaseService = new DatabaseService();

export default databaseService;
