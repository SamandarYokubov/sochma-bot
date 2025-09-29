const Logger = require('../utils/logger');
const config = require('../config');
const databaseService = require('./database');
const User = require('../models/User');
const Chat = require('../models/Chat');

class MemoryStorage {
  constructor() {
    this.users = new Map();
    this.chats = new Map();
    this.stats = {
      totalUsers: 0,
      activeUsers: 0,
      messagesProcessed: 0
    };
    
    // MongoDB sync settings
    this.mongoEnabled = config.storage.useMongoDB;
    this.syncInProgress = false;
    
    // Start intervals
    this.startCleanupInterval();
    if (this.mongoEnabled) {
      this.startSyncInterval();
    }
    
    Logger.info('Memory storage initialized', { 
      mongoEnabled: this.mongoEnabled 
    });
  }

  /**
   * Store or update user information
   * @param {number} userId - Telegram user ID
   * @param {Object} userData - User data to store
   * @param {Object} chatData- Telegram chat Data
   */
  async setUser(userId, userData, chatData) {
    try {
      const existingUser = this.users.get(userId);
      const user = {
        id: userId,
        username: userData.username || null,
        firstName: userData.first_name || null,
        lastName: userData.last_name || null,
        languageCode: userData.language_code || 'en',
        isBot: userData.is_bot || false,
        lastSeen: new Date(),
        messageCount: existingUser ? existingUser.messageCount + 1 : 1,
        createdAt: existingUser ? existingUser.createdAt : new Date(),
        chatId: chatData.id || null,
        chatType: chatData.type || 'private',
        ...userData
      };

      // Store in memory
      this.users.set(userId, user);
      
      // Store chat information
      if (chatData) {
        await this.setChat(chatData);
      }
      
      // Store in MongoDB if enabled
      if (this.mongoEnabled && databaseService.isConnected) {
        await this.syncUserToMongoDB(user);
      }
      
      if (!existingUser) {
        this.stats.totalUsers++;
      }
      
      this.stats.activeUsers = this.users.size;
      this.stats.messagesProcessed++;
      
      Logger.debug('User data stored/updated', { userId, username: user.username });
    } catch (error) {
      Logger.error('Error storing user data', { error: error.message, userId });
    }
  }

  /**
   * Get user information
   * @param {number} userId - Telegram user ID
   * @returns {Object|null} User data or null if not found
   */
  getUser(userId) {
    const user = this.users.get(userId);
    if (user) {
      // Update last seen
      user.lastSeen = new Date();
      this.users.set(userId, user);
    }
    return user;
  }

  /**
   * Get all users
   * @returns {Array} Array of user objects
   */
  getAllUsers() {
    return Array.from(this.users.values());
  }

  /**
   * Get user statistics
   * @returns {Object} Statistics object
   */
  getStats() {
    return {
      ...this.stats,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime()
    };
  }

  /**
   * Remove user from memory
   * @param {number} userId - Telegram user ID
   */
  removeUser(userId) {
    const user = this.users.get(userId);
    if (user) {
      this.users.delete(userId);
      this.stats.activeUsers = this.users.size;
      Logger.info('User removed from memory', { userId, username: user.username });
    }
  }

  /**
   * Clean up inactive users
   */
  cleanupInactiveUsers() {
    const now = new Date();
    const inactiveThreshold = 7 * 24 * 60 * 60 * 1000; // 7 days
    
    let removedCount = 0;
    
    for (const [userId, user] of this.users.entries()) {
      const timeSinceLastSeen = now - user.lastSeen;
      
      if (timeSinceLastSeen > inactiveThreshold) {
        this.users.delete(userId);
        removedCount++;
      }
    }
    
    this.stats.activeUsers = this.users.size;
    
    if (removedCount > 0) {
      Logger.info('Cleaned up inactive users', { removedCount });
    }
  }

  /**
   * Start cleanup interval
   */
  startCleanupInterval() {
    setInterval(() => {
      this.cleanupInactiveUsers();
    }, config.storage.cleanupInterval);
    
    Logger.info('Cleanup interval started', { 
      interval: config.storage.cleanupInterval 
    });
  }

  /**
   * Store or update chat information
   * @param {Object} chatData - Chat data to store
   */
  async setChat(chatData) {
    try {
      const chatId = chatData.id;
      const existingChat = this.chats.get(chatId);
      
      const chat = {
        id: chatId,
        type: chatData.type || 'private',
        title: chatData.title || null,
        username: chatData.username || null,
        description: chatData.description || null,
        lastActivity: new Date(),
        messageCount: existingChat ? existingChat.messageCount + 1 : 1,
        firstActivity: existingChat ? existingChat.firstActivity : new Date(),
        ...chatData
      };

      // Store in memory
      this.chats.set(chatId, chat);
      
      // Store in MongoDB if enabled
      if (this.mongoEnabled && databaseService.isConnected) {
        await this.syncChatToMongoDB(chat);
      }
      
      Logger.debug('Chat data stored/updated', { chatId, type: chat.type });
    } catch (error) {
      Logger.error('Error storing chat data', { error: error.message, chatId: chatData.id });
    }
  }

  /**
   * Sync user data to MongoDB
   * @param {Object} user - User data to sync
   */
  async syncUserToMongoDB(user) {
    try {
      const userData = {
        telegramId: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        languageCode: user.languageCode,
        isBot: user.isBot,
        chatId: user.chatId,
        chatType: user.chatType,
        messageCount: user.messageCount,
        lastSeen: user.lastSeen,
        firstSeen: user.createdAt,
        isActive: true,
        blocked: false
      };

      await User.findOneAndUpdate(
        { telegramId: user.id },
        userData,
        { upsert: true, new: true }
      );
      
      Logger.debug('User synced to MongoDB', { userId: user.id });
    } catch (error) {
      Logger.error('Error syncing user to MongoDB', { error: error.message, userId: user.id });
    }
  }

  /**
   * Sync chat data to MongoDB
   * @param {Object} chat - Chat data to sync
   */
  async syncChatToMongoDB(chat) {
    try {
      const chatData = {
        chatId: chat.id,
        chatType: chat.type,
        title: chat.title,
        username: chat.username,
        description: chat.description,
        messageCount: chat.messageCount,
        lastActivity: chat.lastActivity,
        firstActivity: chat.firstActivity,
        isActive: true,
        blocked: false
      };

      await Chat.findOneAndUpdate(
        { chatId: chat.id },
        chatData,
        { upsert: true, new: true }
      );
      
      Logger.debug('Chat synced to MongoDB', { chatId: chat.id });
    } catch (error) {
      Logger.error('Error syncing chat to MongoDB', { error: error.message, chatId: chat.id });
    }
  }

  /**
   * Load users from MongoDB
   */
  async loadUsersFromMongoDB() {
    try {
      if (!this.mongoEnabled || !databaseService.isConnected) {
        return;
      }

      const users = await User.find({ isActive: true }).limit(config.storage.maxUsers);
      
      for (const user of users) {
        const userData = {
          id: user.telegramId,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          languageCode: user.languageCode,
          isBot: user.isBot,
          chatId: user.chatId,
          chatType: user.chatType,
          messageCount: user.messageCount,
          lastSeen: user.lastSeen,
          createdAt: user.firstSeen
        };
        
        this.users.set(user.telegramId, userData);
      }
      
      this.stats.activeUsers = this.users.size;
      Logger.info('Users loaded from MongoDB', { count: users.length });
    } catch (error) {
      Logger.error('Error loading users from MongoDB', { error: error.message });
    }
  }

  /**
   * Start sync interval with MongoDB
   */
  startSyncInterval() {
    setInterval(async () => {
      if (this.syncInProgress || !databaseService.isConnected) {
        return;
      }
      
      this.syncInProgress = true;
      
      try {
        // Sync all users in memory to MongoDB
        for (const [userId, user] of this.users.entries()) {
          await this.syncUserToMongoDB(user);
        }
        
        // Sync all chats in memory to MongoDB
        for (const [chatId, chat] of this.chats.entries()) {
          await this.syncChatToMongoDB(chat);
        }
        
        Logger.debug('Memory storage synced with MongoDB');
      } catch (error) {
        Logger.error('Error during MongoDB sync', { error: error.message });
      } finally {
        this.syncInProgress = false;
      }
    }, config.storage.syncInterval);
    
    Logger.info('MongoDB sync interval started', { 
      interval: config.storage.syncInterval 
    });
  }

  /**
   * Get MongoDB statistics
   */
  async getMongoStats() {
    try {
      if (!this.mongoEnabled || !databaseService.isConnected) {
        return null;
      }

      const userStats = await User.getUserStats();
      const chatStats = await Chat.getChatStats();
      const dbStats = await databaseService.getStats();
      
      return {
        users: userStats[0] || {},
        chats: chatStats,
        database: dbStats
      };
    } catch (error) {
      Logger.error('Error getting MongoDB stats', { error: error.message });
      return null;
    }
  }

  /**
   * Clear all data (for testing)
   */
  clear() {
    this.users.clear();
    this.chats.clear();
    this.stats = {
      totalUsers: 0,
      activeUsers: 0,
      messagesProcessed: 0
    };
    Logger.info('Memory storage cleared');
  }
}

// Create singleton instance
const memoryStorage = new MemoryStorage();

module.exports = memoryStorage;
