import axios from 'axios';
import { config } from '../config/index.js';
import logger from '../utils/logger.js';

class SochmaApiService {
  constructor() {
    this.baseURL = config.sochma.apiUrl;
    this.apiKey = config.sochma.apiKey;
    this.timeout = 10000; // 10 seconds
    
    // Create axios instance
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'SochmaBot/1.0.0'
      }
    });

    // Add request/response interceptors
    this.setupInterceptors();
  }

  setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        logger.debug('Sochma API Request:', {
          method: config.method,
          url: config.url,
          data: config.data
        });
        return config;
      },
      (error) => {
        logger.error('Sochma API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        logger.debug('Sochma API Response:', {
          status: response.status,
          url: response.config.url,
          data: response.data
        });
        return response;
      },
      (error) => {
        logger.error('Sochma API Response Error:', {
          status: error.response?.status,
          url: error.config?.url,
          message: error.message,
          data: error.response?.data
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get user profile from Sochma platform
   */
  async getUserProfile(telegramId) {
    try {
      const response = await this.client.get(`/users/telegram/${telegramId}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null; // User not found on platform
      }
      throw error;
    }
  }

  /**
   * Create or update user profile on Sochma platform
   */
  async createOrUpdateUser(userData) {
    try {
      const response = await this.client.post('/users', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Search for users on Sochma platform
   */
  async searchUsers(searchCriteria) {
    try {
      const response = await this.client.post('/users/search', searchCriteria);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user connections/network
   */
  async getUserConnections(telegramId) {
    try {
      const response = await this.client.get(`/users/telegram/${telegramId}/connections`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return { connections: [] };
      }
      throw error;
    }
  }

  /**
   * Create a connection request
   */
  async createConnectionRequest(fromUserId, toUserId, message) {
    try {
      const response = await this.client.post('/connections/request', {
        fromUserId,
        toUserId,
        message
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get platform statistics
   */
  async getPlatformStats() {
    try {
      const response = await this.client.get('/stats');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get industry list
   */
  async getIndustries() {
    try {
      const response = await this.client.get('/industries');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get location list
   */
  async getLocations() {
    try {
      const response = await this.client.get('/locations');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Send notification to user
   */
  async sendNotification(telegramId, notification) {
    try {
      const response = await this.client.post('/notifications/send', {
        telegramId,
        ...notification
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Health check for Sochma API
   */
  async healthCheck() {
    try {
      const response = await this.client.get('/health');
      return {
        status: 'healthy',
        data: response.data
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  /**
   * Sync user data with Sochma platform
   */
  async syncUserData(user) {
    try {
      const userData = {
        telegramId: user.telegramId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profile: user.profile,
        userType: user.userType,
        preferences: user.preferences,
        lastActivity: user.lastActivity
      };

      const response = await this.createOrUpdateUser(userData);
      logger.info('User data synced with Sochma platform', {
        telegramId: user.telegramId,
        platformUserId: response.id
      });
      
      return response;
    } catch (error) {
      logger.error('Failed to sync user data with Sochma platform:', error);
      throw error;
    }
  }

  /**
   * Get user analytics
   */
  async getUserAnalytics(telegramId) {
    try {
      const response = await this.client.get(`/users/telegram/${telegramId}/analytics`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Report user activity
   */
  async reportUserActivity(telegramId, activity) {
    try {
      const response = await this.client.post('/users/activity', {
        telegramId,
        activity,
        timestamp: new Date().toISOString()
      });
      return response.data;
    } catch (error) {
      // Don't throw error for activity reporting failures
      logger.warn('Failed to report user activity:', error);
    }
  }
}

// Create singleton instance
const sochmaApiService = new SochmaApiService();

export default sochmaApiService;
