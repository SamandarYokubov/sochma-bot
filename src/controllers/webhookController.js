import express from 'express';
import { config } from '../config/index.js';
import logger from '../utils/logger.js';

class WebhookController {
  constructor(bot) {
    this.bot = bot;
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    // Parse JSON bodies
    this.app.use(express.json({ limit: '10mb' }));
    
    // Parse URL-encoded bodies
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Security headers
    this.app.use((req, res, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      next();
    });
    
    // Request logging
    this.app.use((req, res, next) => {
      logger.info('Webhook Request', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });
      next();
    });
  }

  setupRoutes() {
    // Webhook endpoint for Telegram
    this.app.post('/webhook', this.handleWebhook.bind(this));
    
    // Health check endpoint
    this.app.get('/health', this.handleHealthCheck.bind(this));
    
    // Stats endpoint
    this.app.get('/stats', this.handleStats.bind(this));
    
    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        status: 'ok',
        service: 'Sochma Bot',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      });
    });
    
    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: 'The requested resource was not found',
        timestamp: new Date().toISOString()
      });
    });
    
    // Error handler
    this.app.use((error, req, res, next) => {
      logger.error('Webhook Error', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip
      });
      
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString()
      });
    });
  }

  async handleWebhook(req, res) {
    try {
      const update = req.body;
      
      // Validate update structure
      if (!update || typeof update !== 'object') {
        logger.warn('Invalid webhook update received', { update });
        return res.status(400).json({ error: 'Invalid update format' });
      }
      
      // Log webhook update
      logger.debug('Webhook update received', {
        updateId: update.update_id,
        updateType: this.getUpdateType(update),
        userId: update.message?.from?.id || update.callback_query?.from?.id,
        timestamp: new Date().toISOString()
      });
      
      // Process update with bot
      await this.bot.handleUpdate(update);
      
      // Send success response
      res.status(200).json({ status: 'ok' });
      
    } catch (error) {
      logger.error('Webhook processing error', {
        error: error.message,
        stack: error.stack,
        body: req.body
      });
      
      // Still send 200 to prevent Telegram from retrying
      res.status(200).json({ 
        status: 'error',
        message: 'Update processed with errors'
      });
    }
  }

  async handleHealthCheck(req, res) {
    try {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version,
        environment: config.app.env
      };
      
      // Check database connection
      try {
        const databaseService = (await import('../services/database.js')).default;
        const dbHealth = await databaseService.healthCheck();
        health.database = dbHealth;
      } catch (error) {
        health.database = {
          status: 'unhealthy',
          error: error.message
        };
      }
      
      // Check Sochma API connection
      try {
        const sochmaApiService = (await import('../services/sochmaApiService.js')).default;
        const apiHealth = await sochmaApiService.healthCheck();
        health.sochmaApi = apiHealth;
      } catch (error) {
        health.sochmaApi = {
          status: 'unhealthy',
          error: error.message
        };
      }
      
      // Determine overall health
      const isHealthy = health.database.status === 'healthy' && 
                       health.sochmaApi.status === 'healthy';
      
      res.status(isHealthy ? 200 : 503).json(health);
      
    } catch (error) {
      logger.error('Health check error', { error: error.message });
      res.status(503).json({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  async handleStats(req, res) {
    try {
      const stats = {
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        version: process.version,
        environment: config.app.env,
        bot: {
          username: config.bot.username,
          webhookUrl: config.webhook.url
        }
      };
      
      // Get user statistics
      try {
        const User = (await import('../models/User.js')).default;
        const Conversation = (await import('../models/Conversation.js')).default;
        
        const userCount = await User.countDocuments();
        const activeUserCount = await User.countDocuments({ 
          status: 'active',
          lastActivity: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        });
        const conversationCount = await Conversation.countDocuments();
        const activeConversationCount = await Conversation.countDocuments({ isActive: true });
        
        stats.users = {
          total: userCount,
          active: activeUserCount,
          conversations: conversationCount,
          activeConversations: activeConversationCount
        };
        
        // User type distribution
        const userTypeStats = await User.aggregate([
          { $group: { _id: '$userType', count: { $sum: 1 } } }
        ]);
        stats.userTypes = userTypeStats.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {});
        
      } catch (error) {
        logger.warn('Failed to get user statistics', { error: error.message });
        stats.users = { error: 'Failed to retrieve user statistics' };
      }
      
      res.json(stats);
      
    } catch (error) {
      logger.error('Stats endpoint error', { error: error.message });
      res.status(500).json({
        error: 'Failed to retrieve statistics',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  getUpdateType(update) {
    if (update.message) return 'message';
    if (update.edited_message) return 'edited_message';
    if (update.channel_post) return 'channel_post';
    if (update.edited_channel_post) return 'edited_channel_post';
    if (update.inline_query) return 'inline_query';
    if (update.chosen_inline_result) return 'chosen_inline_result';
    if (update.callback_query) return 'callback_query';
    if (update.shipping_query) return 'shipping_query';
    if (update.pre_checkout_query) return 'pre_checkout_query';
    if (update.poll) return 'poll';
    if (update.poll_answer) return 'poll_answer';
    if (update.my_chat_member) return 'my_chat_member';
    if (update.chat_member) return 'chat_member';
    if (update.chat_join_request) return 'chat_join_request';
    return 'unknown';
  }

  start() {
    const port = config.app.port || 3000;
    
    this.server = this.app.listen(port, () => {
      logger.info(`Webhook server started on port ${port}`);
    });
    
    // Graceful shutdown
    process.on('SIGTERM', this.gracefulShutdown.bind(this));
    process.on('SIGINT', this.gracefulShutdown.bind(this));
  }

  async gracefulShutdown() {
    logger.info('Shutting down webhook server...');
    
    if (this.server) {
      this.server.close(() => {
        logger.info('Webhook server closed');
        process.exit(0);
      });
    }
  }
}

export default WebhookController;
