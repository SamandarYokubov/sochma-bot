import { Telegraf } from 'telegraf';
import express from 'express';
import { config } from '../config/index.js';
import databaseService from '../services/database.js';
import WebhookController from './webhookController.js';
import { errorHandler, handleUnhandledRejection, handleUncaughtException, handleGracefulShutdown } from '../middleware/errorHandler.js';
import { ensureUser, requireActiveUser, trackConversation, rateLimit, logActions } from '../middleware/userMiddleware.js';
import logger from '../utils/logger.js';

// Import handlers
import { startHandler, handleUserTypeSelection, handleProfileSetup, handleProfileSkip } from '../handlers/startHandler.js';
import { profileHandler, handleProfileEdit, handleUserTypeChange, handleUserTypeChangeConfirm, handleProfileStats, handleProfileFieldEdit } from '../handlers/profileHandler.js';
import { searchHandler, handleUserSearch, handleUserTypeSearch, handleIndustrySearch, handleLocationSearch, handleAdvancedSearch, handleUserProfileView } from '../handlers/searchHandler.js';
import { helpHandler, handleProfileHelp, handleSearchHelp, handleSearchTips, handleContactSupport } from '../handlers/helpHandler.js';

class BotController {
  constructor() {
    this.bot = new Telegraf(config.bot.token);
    this.isRunning = false;
    this.webhookController = null;
  }

  async initialize() {
    try {
      logger.info('Initializing Sochma Bot...');

      // Connect to database
      await databaseService.connect();
      await databaseService.createIndexes();

      // Set up error handling
      handleUnhandledRejection();
      handleUncaughtException();

      // Set up middleware
      this.setupMiddleware();

      // Set up commands
      this.setupCommands();

      // Set up callbacks
      this.setupCallbacks();

      // Set up message handlers
      this.setupMessageHandlers();

      // Set up error handling
      this.bot.use(errorHandler);

      logger.info('Bot initialization completed successfully');
    } catch (error) {
      logger.error('Failed to initialize bot:', error);
      throw error;
    }
  }

  setupMiddleware() {
    // Global middleware
    this.bot.use(ensureUser);
    this.bot.use(requireActiveUser);
    this.bot.use(trackConversation);
    this.bot.use(rateLimit(config.rateLimit.maxRequests, config.rateLimit.windowMs));
    this.bot.use(logActions);
  }

  setupCommands() {
    // Start command
    this.bot.start(startHandler);

    // Profile command
    this.bot.command('profile', profileHandler);

    // Search command
    this.bot.command('search', searchHandler);

    // Help command
    this.bot.command('help', helpHandler);

    // Settings command
    this.bot.command('settings', async (ctx) => {
      await ctx.reply(
        `⚙️ **Settings**\n\n` +
        `Manage your bot preferences and account settings.`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '🔔 Notifications', callback_data: 'settings_notifications' },
                { text: '🌐 Language', callback_data: 'settings_language' }
              ],
              [
                { text: '🔒 Privacy', callback_data: 'settings_privacy' },
                { text: '📊 Data & Analytics', callback_data: 'settings_data' }
              ],
              [
                { text: '🔙 Back to Menu', callback_data: 'main_menu' }
              ]
            ]
          }
        }
      );
    });

    // Stats command
    this.bot.command('stats', async (ctx) => {
      const user = ctx.user;
      const stats = {
        accountAge: user.accountAge,
        profileCompleteness: calculateProfileCompleteness(user),
        lastActivity: user.lastActivity,
        userType: user.userType,
        subscription: user.subscription?.plan || 'free'
      };

      await ctx.reply(
        `📊 **Your Statistics**\n\n` +
        `📅 **Account Age:** ${stats.accountAge} days\n` +
        `📝 **Profile Completeness:** ${stats.profileCompleteness}%\n` +
        `🕒 **Last Activity:** ${stats.lastActivity.toLocaleDateString()}\n` +
        `👥 **User Type:** ${stats.userType}\n` +
        `📊 **Subscription:** ${stats.subscription}\n\n` +
        `Keep your profile updated for better visibility!`
      );
    });

    // Contact command
    this.bot.command('contact', handleContactSupport);
  }

  setupCallbacks() {
    // Start handler callbacks
    this.bot.action('user_type_investor', handleUserTypeSelection);
    this.bot.action('user_type_buyer', handleUserTypeSelection);
    this.bot.action('user_type_both', handleUserTypeSelection);
    this.bot.action('profile_setup', handleProfileSetup);
    this.bot.action('profile_skip', handleProfileSkip);

    // Profile handler callbacks
    this.bot.action('profile_view', profileHandler);
    this.bot.action('profile_edit', handleProfileEdit);
    this.bot.action('profile_change_type', handleUserTypeChange);
    this.bot.action('change_type_investor', handleUserTypeChangeConfirm);
    this.bot.action('change_type_buyer', handleUserTypeChangeConfirm);
    this.bot.action('change_type_both', handleUserTypeChangeConfirm);
    this.bot.action('change_type_none', handleUserTypeChangeConfirm);
    this.bot.action('profile_stats', handleProfileStats);
    this.bot.action('profile_privacy', async (ctx) => {
      await ctx.answerCbQuery();
      await ctx.editMessageText('🔒 Privacy settings coming soon!');
    });

    // Profile field editing callbacks
    this.bot.action('edit_company', (ctx) => handleProfileFieldEdit(ctx, 'company'));
    this.bot.action('edit_industry', (ctx) => handleProfileFieldEdit(ctx, 'industry'));
    this.bot.action('edit_location', (ctx) => handleProfileFieldEdit(ctx, 'location'));
    this.bot.action('edit_experience', (ctx) => handleProfileFieldEdit(ctx, 'experience'));
    this.bot.action('edit_investment', (ctx) => handleProfileFieldEdit(ctx, 'investmentRange'));
    this.bot.action('edit_bio', (ctx) => handleProfileFieldEdit(ctx, 'bio'));
    this.bot.action('edit_website', (ctx) => handleProfileFieldEdit(ctx, 'website'));
    this.bot.action('edit_linkedin', (ctx) => handleProfileFieldEdit(ctx, 'linkedin'));

    // Search handler callbacks
    this.bot.action('search_menu', searchHandler);
    this.bot.action('search_users', handleUserSearch);
    this.bot.action(/^search_users_type_/, handleUserTypeSearch);
    this.bot.action('search_companies', async (ctx) => {
      await ctx.answerCbQuery();
      await ctx.editMessageText('🏢 Company search coming soon!');
    });
    this.bot.action('search_industry', handleIndustrySearch);
    this.bot.action('search_location', handleLocationSearch);
    this.bot.action('search_investment', async (ctx) => {
      await ctx.answerCbQuery();
      await ctx.editMessageText('💰 Investment range search coming soon!');
    });
    this.bot.action('search_advanced', handleAdvancedSearch);
    this.bot.action(/^view_user_/, handleUserProfileView);
    this.bot.action(/^contact_user_/, async (ctx) => {
      await ctx.answerCbQuery();
      await ctx.editMessageText('💬 Contact feature coming soon!');
    });
    this.bot.action(/^save_user_/, async (ctx) => {
      await ctx.answerCbQuery();
      await ctx.editMessageText('⭐ Save contact feature coming soon!');
    });

    // Help handler callbacks
    this.bot.action('help', helpHandler);
    this.bot.action('help_profile', handleProfileHelp);
    this.bot.action('help_search', handleSearchHelp);
    this.bot.action('help_search_tips', handleSearchTips);
    this.bot.action('contact_support', handleContactSupport);

    // Main menu callback
    this.bot.action('main_menu', async (ctx) => {
      await ctx.answerCbQuery();
      await startHandler(ctx);
    });

    // Dashboard callback
    this.bot.action('dashboard', async (ctx) => {
      await ctx.answerCbQuery();
      await ctx.editMessageText('📊 Dashboard coming soon!');
    });
  }

  setupMessageHandlers() {
    // Handle text messages for profile setup and advanced search
    this.bot.on('text', async (ctx) => {
      const conversation = ctx.conversation;
      
      if (!conversation) {
        await ctx.reply('Please use a command to interact with the bot. Type /help for available commands.');
        return;
      }

      switch (conversation.state) {
        case 'profile_setup':
          await this.handleProfileSetupMessage(ctx);
          break;
        case 'profile_field_edit':
          await this.handleProfileFieldEditMessage(ctx);
          break;
        case 'advanced_search':
          await this.handleAdvancedSearchMessage(ctx);
          break;
        default:
          await ctx.reply('Please use a command to interact with the bot. Type /help for available commands.');
      }
    });
  }

  async handleProfileSetupMessage(ctx) {
    try {
      const conversation = ctx.conversation;
      const user = ctx.user;
      const message = ctx.message.text.trim();

      if (message.toLowerCase() === 'skip') {
        conversation.step += 1;
        await conversation.save();
        await this.continueProfileSetup(ctx);
        return;
      }

      const fields = ['company', 'industry', 'location', 'bio'];
      const fieldNames = ['Company/Organization name', 'Industry', 'Location', 'Bio'];

      if (conversation.step <= fields.length) {
        const field = fields[conversation.step - 1];
        
        if (!user.profile) {
          user.profile = {};
        }
        
        user.profile[field] = message;
        await user.save();

        conversation.step += 1;
        await conversation.save();

        await ctx.reply(`✅ ${fieldNames[conversation.step - 2]} saved!`);
        await this.continueProfileSetup(ctx);
      }
    } catch (error) {
      logger.error('Error handling profile setup message:', error);
      await ctx.reply('❌ Error saving profile information. Please try again.');
    }
  }

  async continueProfileSetup(ctx) {
    const conversation = ctx.conversation;
    const fieldNames = ['Company/Organization name', 'Industry', 'Location', 'Bio'];
    const prompts = [
      'Great! Now tell me your industry:',
      'Perfect! What\'s your location?',
      'Excellent! Finally, tell me a bit about yourself (bio):',
      '🎉 Profile setup completed! You can now start using the bot.'
    ];

    if (conversation.step <= fieldNames.length) {
      await ctx.reply(prompts[conversation.step - 1]);
    } else {
      conversation.state = 'idle';
      await conversation.save();
      
      await ctx.reply(
        `🎉 **Profile Setup Complete!**\n\n` +
        `Your profile has been successfully set up. You can now:\n` +
        `• Search for other users using /search\n` +
        `• View your profile using /profile\n` +
        `• Get help using /help\n\n` +
        `Happy connecting! 🚀`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '🔍 Start Searching', callback_data: 'search_menu' },
                { text: '👤 View Profile', callback_data: 'profile_view' }
              ]
            ]
          }
        }
      );
    }
  }

  async handleProfileFieldEditMessage(ctx) {
    try {
      const conversation = ctx.conversation;
      const user = ctx.user;
      const message = ctx.message.text.trim();
      const field = conversation.data.editingField;

      if (message.toLowerCase() === 'skip') {
        await ctx.reply('Field update skipped.');
      } else {
        if (!user.profile) {
          user.profile = {};
        }
        
        user.profile[field] = message;
        await user.save();
        
        await ctx.reply(`✅ ${field} updated successfully!`);
      }

      // Reset conversation state
      conversation.state = 'idle';
      conversation.data = {};
      await conversation.save();

      // Return to profile view
      await profileHandler(ctx);
    } catch (error) {
      logger.error('Error handling profile field edit message:', error);
      await ctx.reply('❌ Error updating profile field. Please try again.');
    }
  }

  async handleAdvancedSearchMessage(ctx) {
    try {
      const message = ctx.message.text.trim();
      
      // Parse search criteria (simple implementation)
      const lines = message.split('\n');
      const criteria = {};
      
      lines.forEach(line => {
        const [key, value] = line.split(':').map(s => s.trim());
        if (key && value) {
          criteria[key.toLowerCase()] = value;
        }
      });

      // Perform search based on criteria
      const User = (await import('../models/User.js')).default;
      let query = { status: 'active' };

      if (criteria.type) {
        query.userType = criteria.type;
      }
      if (criteria.industry) {
        query['profile.industry'] = new RegExp(criteria.industry, 'i');
      }
      if (criteria.location) {
        query['profile.location'] = new RegExp(criteria.location, 'i');
      }

      const users = await User.find(query).limit(10);

      if (users.length === 0) {
        await ctx.reply('❌ No users found matching your criteria.');
        return;
      }

      let resultsText = `🔍 **Search Results** (${users.length} found)\n\n`;
      
      users.forEach((user, index) => {
        resultsText += `${index + 1}. **${user.fullName}**\n`;
        if (user.profile?.company) resultsText += `   🏢 ${user.profile.company}\n`;
        if (user.profile?.industry) resultsText += `   🏭 ${user.profile.industry}\n`;
        if (user.profile?.location) resultsText += `   📍 ${user.profile.location}\n`;
        resultsText += `   🕒 Last active: ${user.lastActivity.toLocaleDateString()}\n\n`;
      });

      await ctx.reply(resultsText, {
        reply_markup: {
          inline_keyboard: [
            ...users.map((user, index) => [
              { 
                text: `👤 ${user.fullName}`, 
                callback_data: `view_user_${user._id}` 
              }
            ]),
            [
              { text: '🔍 New Search', callback_data: 'search_advanced' },
              { text: '🔙 Back to Search', callback_data: 'search_menu' }
            ]
          ]
        }
      });

      // Reset conversation state
      ctx.conversation.state = 'idle';
      await ctx.conversation.save();

    } catch (error) {
      logger.error('Error handling advanced search message:', error);
      await ctx.reply('❌ Error performing search. Please try again.');
    }
  }

  async start() {
    try {
      if (this.isRunning) {
        logger.warn('Bot is already running');
        return;
      }

      logger.info('Starting Sochma Bot...');

      if (config.webhook.url) {
        // Use webhook for production
        this.webhookController = new WebhookController(this.bot);
        this.webhookController.start();
        
        // Set webhook URL
        await this.bot.telegram.setWebhook(config.webhook.url);
        logger.info(`Bot started with webhook on ${config.webhook.url}`);
      } else {
        // Use polling for development
        await this.bot.launch();
        logger.info('Bot started with polling');
      }

      this.isRunning = true;

      // Set up graceful shutdown
      handleGracefulShutdown(this.bot);

      logger.info('Sochma Bot is now running!');
    } catch (error) {
      logger.error('Failed to start bot:', error);
      throw error;
    }
  }

  async stop(signal = 'SIGTERM') {
    try {
      if (!this.isRunning) {
        logger.warn('Bot is not running');
        return;
      }

      logger.info(`Stopping bot (${signal})...`);
      
      // Stop webhook controller if running
      if (this.webhookController) {
        await this.webhookController.gracefulShutdown();
      }
      
      // Delete webhook if using webhook mode
      if (config.webhook.url) {
        await this.bot.telegram.deleteWebhook();
      }
      
      await this.bot.stop(signal);
      this.isRunning = false;
      
      logger.info('Bot stopped successfully');
    } catch (error) {
      logger.error('Error stopping bot:', error);
      throw error;
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      database: databaseService.getConnectionStatus(),
      config: {
        env: config.app.env,
        botUsername: config.bot.username
      }
    };
  }
}

// Helper function
const calculateProfileCompleteness = (user) => {
  const profile = user.profile || {};
  const fields = ['company', 'industry', 'location', 'experience', 'bio', 'website', 'linkedin'];
  const filledFields = fields.filter(field => profile[field] && profile[field].trim());
  return Math.round((filledFields.length / fields.length) * 100);
};

export default BotController;
