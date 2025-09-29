const Logger = require('../utils/logger');
const registrationFSM = require('../services/registrationFSM');
const User = require('../models/User');

class RegistrationHandler {
  constructor(bot) {
    this.bot = bot;
    this.registrationFSM = registrationFSM;
  }

  /**
   * Handle registration start
   * @param {Object} ctx - Telegraf context
   */
  async handleRegistrationStart(ctx) {
    try {
      const userId = ctx.from.id;
      const chatId = ctx.chat.id;

      Logger.info('Starting registration process', { userId, chatId });

      const result = await this.registrationFSM.startRegistration(userId, ctx.from, ctx.chat);
      
      if (result.success) {
        await ctx.reply(result.message, {
          parse_mode: 'Markdown',
          ...result.keyboard
        });
      } else {
        await ctx.reply(`❌ ${result.error}`);
      }
    } catch (error) {
      Logger.error('Error handling registration start', { error: error.message });
      await ctx.reply('❌ An error occurred. Please try again.');
    }
  }

  /**
   * Handle phone number input
   * @param {Object} ctx - Telegraf context
   */
  async handlePhoneNumberInput(ctx) {
    try {
      const userId = ctx.from.id;
      const phoneNumber = ctx.message.text;

      Logger.info('Processing phone number input', { userId, phoneNumber });

      const result = await this.registrationFSM.processPhoneNumber(userId, phoneNumber);
      
      if (result.success) {
        await ctx.reply(result.message, {
          parse_mode: 'Markdown',
          ...result.keyboard
        });
      } else {
        await ctx.reply(`❌ ${result.error}`, {
          ...result.keyboard
        });
      }
    } catch (error) {
      Logger.error('Error handling phone number input', { error: error.message });
      await ctx.reply('❌ An error occurred. Please try again.');
    }
  }

  /**
   * Handle full name input
   * @param {Object} ctx - Telegraf context
   */
  async handleFullNameInput(ctx) {
    try {
      const userId = ctx.from.id;
      const fullName = ctx.message.text;

      Logger.info('Processing full name input', { userId, fullName });

      const result = await this.registrationFSM.processFullName(userId, fullName);
      
      if (result.success) {
        await ctx.reply(result.message, {
          parse_mode: 'Markdown',
          ...result.keyboard
        });
      } else {
        await ctx.reply(`❌ ${result.error}`, {
          ...result.keyboard
        });
      }
    } catch (error) {
      Logger.error('Error handling full name input', { error: error.message });
      await ctx.reply('❌ An error occurred. Please try again.');
    }
  }

  /**
   * Handle role selection callback
   * @param {Object} ctx - Telegraf context
   */
  async handleRoleSelection(ctx) {
    try {
      const userId = ctx.from.id;
      const role = ctx.callbackQuery.data.replace('role_', '');

      Logger.info('Processing role selection', { userId, role });

      // Answer the callback query
      await ctx.answerCbQuery();

      const result = await this.registrationFSM.processRoleSelection(userId, role);
      
      if (result.success) {
        await ctx.reply(result.message, {
          parse_mode: 'Markdown',
          ...result.keyboard
        });
      } else {
        await ctx.reply(`❌ ${result.error}`, {
          ...result.keyboard
        });
      }
    } catch (error) {
      Logger.error('Error handling role selection', { error: error.message });
      await ctx.answerCbQuery('❌ An error occurred');
    }
  }

  /**
   * Handle agenda view
   * @param {Object} ctx - Telegraf context
   */
  async handleAgendaView(ctx) {
    try {
      const userId = ctx.from.id;

      Logger.info('Showing agenda', { userId });

      const result = await this.registrationFSM.showAgenda(userId);
      
      if (result.success) {
        await ctx.reply(result.message, {
          parse_mode: 'Markdown',
          ...result.keyboard
        });
      } else {
        await ctx.reply(`❌ ${result.error}`);
      }
    } catch (error) {
      Logger.error('Error handling agenda view', { error: error.message });
      await ctx.reply('❌ An error occurred. Please try again.');
    }
  }

  /**
   * Handle registration completion
   * @param {Object} ctx - Telegraf context
   */
  async handleRegistrationCompletion(ctx) {
    try {
      const userId = ctx.from.id;

      Logger.info('Completing registration', { userId });

      // Answer the callback query
      await ctx.answerCbQuery();

      const result = await this.registrationFSM.completeRegistration(userId);
      
      if (result.success) {
        // Get user data for the completion message
        const user = await User.findByTelegramId(userId);
        const completionMessage = this.getCompletionMessage(user);
        
        await ctx.reply(completionMessage, {
          parse_mode: 'Markdown'
        });

        // Send welcome message with main menu
        await this.sendWelcomeMessage(ctx, user);
      } else {
        await ctx.reply(`❌ ${result.error}`);
      }
    } catch (error) {
      Logger.error('Error handling registration completion', { error: error.message });
      await ctx.answerCbQuery('❌ An error occurred');
    }
  }

  /**
   * Get completion message with user data
   * @param {Object} user - User object
   * @returns {string} Completion message
   */
  getCompletionMessage(user) {
    const roleEmoji = {
      'buyer': '🏠',
      'investor': '💰',
      'both': '🔄'
    };

    const roleText = {
      'buyer': 'Buyer',
      'investor': 'Investor',
      'both': 'Buyer & Investor'
    };

    return `✅ *Registration Complete!*

Welcome to Sochma, ${user.userFullName}!

Your registration details:
📱 Phone: ${user.phoneNumber}
👤 Name: ${user.userFullName}
🎯 Role: ${roleEmoji[user.role]} ${roleText[user.role]}

You can now start using all the bot features. Use /help to see available commands.`;
  }

  /**
   * Send welcome message with main menu
   * @param {Object} ctx - Telegraf context
   * @param {Object} user - User object
   */
  async sendWelcomeMessage(ctx, user) {
    const welcomeText = `🎉 *Welcome to Sochma, ${user.userFullName}!*

You're all set up and ready to explore the real estate market. Here's what you can do:

🔍 **Search Properties** - Find properties that match your criteria
💰 **Investment Opportunities** - Discover profitable investments
🤝 **Connect with Others** - Network with buyers and investors
📊 **Market Insights** - Get the latest market data
💬 **Direct Messaging** - Chat with property owners and investors

Use the buttons below or type /help for more options.`;

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🔍 Search Properties', callback_data: 'search_properties' },
            { text: '💰 Investments', callback_data: 'investments' }
          ],
          [
            { text: '🤝 Network', callback_data: 'network' },
            { text: '📊 Market Data', callback_data: 'market_data' }
          ],
          [
            { text: 'ℹ️ My Profile', callback_data: 'my_profile' },
            { text: '❓ Help', callback_data: 'help' }
          ]
        ]
      }
    };

    await ctx.reply(welcomeText, {
      parse_mode: 'Markdown',
      ...keyboard
    });
  }

  /**
   * Check if user is in registration process
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} True if in registration
   */
  async isInRegistration(userId) {
    try {
      const state = await this.registrationFSM.getCurrentState(userId);
      return state !== 'completed' && state !== 'not_started';
    } catch (error) {
      Logger.error('Error checking registration state', { error: error.message, userId });
      return false;
    }
  }

  /**
   * Get current registration state
   * @param {number} userId - User ID
   * @returns {Promise<string>} Current state
   */
  async getCurrentState(userId) {
    return await this.registrationFSM.getCurrentState(userId);
  }

  /**
   * Reset registration (for testing or admin purposes)
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  async resetRegistration(userId) {
    try {
      const user = await User.findByTelegramId(userId);
      if (user) {
        user.registrationState = 'not_started';
        user.isRegistered = false;
        user.phoneNumber = null;
        user.userFullName = null;
        user.role = null;
        await user.save();
        return true;
      }
      return false;
    } catch (error) {
      Logger.error('Error resetting registration', { error: error.message, userId });
      return false;
    }
  }
}

module.exports = RegistrationHandler;