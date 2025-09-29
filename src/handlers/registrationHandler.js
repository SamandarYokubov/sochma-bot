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
   * @param {Object} msg - Telegram message object
   */
  async handleRegistrationStart(msg) {
    try {
      const chatId = msg.chat.id;
      const userId = msg.from.id;

      Logger.info('Starting registration process', { userId, chatId });

      const result = await this.registrationFSM.startRegistration(userId, msg.from, msg.chat);
      
      if (result.success) {
        await this.bot.sendMessage(chatId, result.message, {
          parse_mode: 'Markdown',
          ...result.keyboard
        });
      } else {
        await this.bot.sendMessage(chatId, `❌ ${result.error}`);
      }
    } catch (error) {
      Logger.error('Error handling registration start', { error: error.message });
      await this.bot.sendMessage(msg.chat.id, '❌ An error occurred. Please try again.');
    }
  }

  /**
   * Handle phone number input
   * @param {Object} msg - Telegram message object
   */
  async handlePhoneNumberInput(msg) {
    try {
      const chatId = msg.chat.id;
      const userId = msg.from.id;
      const phoneNumber = msg.text;

      Logger.info('Processing phone number input', { userId, phoneNumber });

      const result = await this.registrationFSM.processPhoneNumber(userId, phoneNumber);
      
      if (result.success) {
        await this.bot.sendMessage(chatId, result.message, {
          parse_mode: 'Markdown',
          ...result.keyboard
        });
      } else {
        await this.bot.sendMessage(chatId, `❌ ${result.error}`, {
          ...result.keyboard
        });
      }
    } catch (error) {
      Logger.error('Error handling phone number input', { error: error.message });
      await this.bot.sendMessage(msg.chat.id, '❌ An error occurred. Please try again.');
    }
  }

  /**
   * Handle full name input
   * @param {Object} msg - Telegram message object
   */
  async handleFullNameInput(msg) {
    try {
      const chatId = msg.chat.id;
      const userId = msg.from.id;
      const fullName = msg.text;

      Logger.info('Processing full name input', { userId, fullName });

      const result = await this.registrationFSM.processFullName(userId, fullName);
      
      if (result.success) {
        await this.bot.sendMessage(chatId, result.message, {
          parse_mode: 'Markdown',
          ...result.keyboard
        });
      } else {
        await this.bot.sendMessage(chatId, `❌ ${result.error}`, {
          ...result.keyboard
        });
      }
    } catch (error) {
      Logger.error('Error handling full name input', { error: error.message });
      await this.bot.sendMessage(msg.chat.id, '❌ An error occurred. Please try again.');
    }
  }

  /**
   * Handle role selection callback
   * @param {Object} callbackQuery - Telegram callback query object
   */
  async handleRoleSelection(callbackQuery) {
    try {
      const chatId = callbackQuery.message.chat.id;
      const userId = callbackQuery.from.id;
      const role = callbackQuery.data.replace('role_', '');

      Logger.info('Processing role selection', { userId, role });

      // Answer the callback query
      await this.bot.answerCallbackQuery(callbackQuery.id);

      const result = await this.registrationFSM.processRoleSelection(userId, role);
      
      if (result.success) {
        await this.bot.sendMessage(chatId, result.message, {
          parse_mode: 'Markdown',
          ...result.keyboard
        });
      } else {
        await this.bot.sendMessage(chatId, `❌ ${result.error}`, {
          ...result.keyboard
        });
      }
    } catch (error) {
      Logger.error('Error handling role selection', { error: error.message });
      await this.bot.answerCallbackQuery(callbackQuery.id, { text: '❌ An error occurred' });
    }
  }

  /**
   * Handle agenda view
   * @param {Object} msg - Telegram message object
   */
  async handleAgendaView(msg) {
    try {
      const chatId = msg.chat.id;
      const userId = msg.from.id;

      Logger.info('Showing agenda', { userId });

      const result = await this.registrationFSM.showAgenda(userId);
      
      if (result.success) {
        await this.bot.sendMessage(chatId, result.message, {
          parse_mode: 'Markdown',
          ...result.keyboard
        });
      } else {
        await this.bot.sendMessage(chatId, `❌ ${result.error}`);
      }
    } catch (error) {
      Logger.error('Error handling agenda view', { error: error.message });
      await this.bot.sendMessage(msg.chat.id, '❌ An error occurred. Please try again.');
    }
  }

  /**
   * Handle registration completion
   * @param {Object} callbackQuery - Telegram callback query object
   */
  async handleRegistrationCompletion(callbackQuery) {
    try {
      const chatId = callbackQuery.message.chat.id;
      const userId = callbackQuery.from.id;

      Logger.info('Completing registration', { userId });

      // Answer the callback query
      await this.bot.answerCallbackQuery(callbackQuery.id);

      const result = await this.registrationFSM.completeRegistration(userId);
      
      if (result.success) {
        // Get user data for the completion message
        const user = await User.findByTelegramId(userId);
        const completionMessage = this.getCompletionMessage(user);
        
        await this.bot.sendMessage(chatId, completionMessage, {
          parse_mode: 'Markdown'
        });

        // Send welcome message with main menu
        await this.sendWelcomeMessage(chatId, user);
      } else {
        await this.bot.sendMessage(chatId, `❌ ${result.error}`);
      }
    } catch (error) {
      Logger.error('Error handling registration completion', { error: error.message });
      await this.bot.answerCallbackQuery(callbackQuery.id, { text: '❌ An error occurred' });
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
   * @param {number} chatId - Chat ID
   * @param {Object} user - User object
   */
  async sendWelcomeMessage(chatId, user) {
    const welcomeText = `🎉 *Welcome to Sochma, ${user.userFullName}!*

You're all set up and ready to explore the real estate market. Here's what you can do:

🔍 **Search Properties** - Find properties that match your criteria
💰 **Investment Opportunities** - Discover profitable investments
🤝 **Connect with Others** - Network with buyers and investors
📊 **Market Insights** - Get the latest market data
💬 **Direct Messaging** - Chat with property owners

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

    await this.bot.sendMessage(chatId, welcomeText, {
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
        user.fullName = null;
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
