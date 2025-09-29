const mongoose = require('mongoose');
const config = require('../config');
const Logger = require('../utils/logger');

class DatabaseService {
  constructor() {
    this.isConnected = false;
    this.connection = null;
  }

  /**
   * Connect to MongoDB
   */
  async connect() {
    try {
      if (this.isConnected) {
        Logger.info('Database already connected');
        return;
      }

      Logger.info('Connecting to MongoDB', { uri: config.mongodb.uri });

      this.connection = await mongoose.connect(config.mongodb.uri, {
        ...config.mongodb.options,
        dbName: config.mongodb.database
      });

      this.isConnected = true;
      
      // Set up connection event listeners
      this.setupEventListeners();

      Logger.info('Successfully connected to MongoDB', {
        database: config.mongodb.database,
        host: this.connection.connection.host,
        port: this.connection.connection.port
      });

    } catch (error) {
      Logger.error('Failed to connect to MongoDB', { 
        error: error.message,
        uri: config.mongodb.uri 
      });
      throw error;
    }
  }

  /**
   * Disconnect from MongoDB
   */
  async disconnect() {
    try {
      if (!this.isConnected) {
        Logger.info('Database not connected');
        return;
      }

      await mongoose.disconnect();
      this.isConnected = false;
      
      Logger.info('Disconnected from MongoDB');
    } catch (error) {
      Logger.error('Error disconnecting from MongoDB', { error: error.message });
      throw error;
    }
  }

  /**
   * Set up connection event listeners
   */
  setupEventListeners() {
    const db = mongoose.connection;

    db.on('error', (error) => {
      Logger.error('MongoDB connection error', { error: error.message });
    });

    db.on('disconnected', () => {
      Logger.warn('MongoDB disconnected');
      this.isConnected = false;
    });

    db.on('reconnected', () => {
      Logger.info('MongoDB reconnected');
      this.isConnected = true;
    });

    db.on('close', () => {
      Logger.warn('MongoDB connection closed');
      this.isConnected = false;
    });
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    };
  }

  /**
   * Get database statistics
   */
  async getStats() {
    try {
      if (!this.isConnected) {
        throw new Error('Database not connected');
      }

      const db = mongoose.connection.db;
      const stats = await db.stats();
      
      return {
        database: db.databaseName,
        collections: stats.collections,
        dataSize: stats.dataSize,
        storageSize: stats.storageSize,
        indexes: stats.indexes,
        objects: stats.objects,
        avgObjSize: stats.avgObjSize
      };
    } catch (error) {
      Logger.error('Error getting database stats', { error: error.message });
      throw error;
    }
  }

  /**
   * Create indexes for better performance
   */
  async createIndexes() {
    try {
      if (!this.isConnected) {
        Logger.warn('Database not connected, skipping index creation');
        return;
      }

      // Import models to ensure they're registered
      // Mongoose will automatically create indexes when models are first used
      require('../models/User');
      require('../models/Chat');

      Logger.info('Models registered, indexes will be created automatically');
    } catch (error) {
      Logger.error('Error creating database indexes', { error: error.message });
      // Don't throw error, just log it as indexes will be created automatically
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      if (!this.isConnected) {
        return { status: 'disconnected', message: 'Database not connected' };
      }

      // Simple ping to check connection
      await mongoose.connection.db.admin().ping();
      
      return { 
        status: 'healthy', 
        message: 'Database connection is healthy',
        ...this.getConnectionStatus()
      };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        message: error.message,
        ...this.getConnectionStatus()
      };
    }
  }
}

// Create singleton instance
const databaseService = new DatabaseService();

module.exports = databaseService;
