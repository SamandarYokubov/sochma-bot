const Logger = require('../utils/logger');
const User = require('../models/User');

class RegistrationFSM {
  constructor() {
    this.states = {
      NOT_STARTED: 'not_started',
      PHONE_ENTERED: 'phone_entered',
      NAME_ENTERED: 'name_entered',
      ROLE_SELECTED: 'role_selected',
      AGENDA_VIEWED: 'agenda_viewed',
      COMPLETED: 'completed'
    };

    this.transitions = {
      [this.states.NOT_STARTED]: [this.states.PHONE_ENTERED],
      [this.states.PHONE_ENTERED]: [this.states.NAME_ENTERED],
      [this.states.NAME_ENTERED]: [this.states.ROLE_SELECTED],
      [this.states.ROLE_SELECTED]: [this.states.AGENDA_VIEWED],
      [this.states.AGENDA_VIEWED]: [this.states.COMPLETED],
      [this.states.COMPLETED]: [] // Terminal state
    };

    Logger.info('Registration FSM initialized');
  }

  /**
   * Get user's current registration state
   * @param {number} userId - Telegram user ID
   * @returns {Promise<string>} Current state
   */
  async getCurrentState(userId) {
    try {
      const user = await User.findByTelegramId(userId);
      return user ? user.registrationState : this.states.NOT_STARTED;
    } catch (error) {
      Logger.error('Error getting current state', { error: error.message, userId });
      return this.states.NOT_STARTED;
    }
  }

  /**
   * Check if transition is valid
   * @param {string} fromState - Current state
   * @param {string} toState - Target state
   * @returns {boolean} True if transition is valid
   */
  isValidTransition(fromState, toState) {
    return this.transitions[fromState] && this.transitions[fromState].includes(toState);
  }

  /**
   * Get next possible states
   * @param {string} currentState - Current state
   * @returns {Array<string>} Array of possible next states
   */
  getNextStates(currentState) {
    return this.transitions[currentState] || [];
  }

  /**
   * Start registration process
   * @param {number} userId - Telegram user ID
   * @param {Object} userData - User data from Telegram
   * @param {Object} chatData - Chat data from Telegram
   * @returns {Promise<Object>} Registration response
   */
  async startRegistration(userId, userData, chatData) {
    try {
      let user = await User.findByTelegramId(userId);
      
      if (!user) {
        // Create new user
        user = new User({
          telegramId: userId,
          username: userData.username,
          firstName: userData.first_name,
          lastName: userData.last_name,
          languageCode: userData.language_code || 'en',
          isBot: userData.is_bot || false,
          chatId: chatData.id,
          chatType: chatData.type || 'private',
          registrationState: this.states.NOT_STARTED,
          isRegistered: false
        });
        await user.save();
      }

      return {
        success: true,
        state: user.registrationState,
        message: this.getStateMessage(user.registrationState),
        keyboard: this.getStateKeyboard(user.registrationState)
      };
    } catch (error) {
      Logger.error('Error starting registration', { error: error.message, userId });
      return {
        success: false,
        error: 'Failed to start registration'
      };
    }
  }

  /**
   * Process phone number input
   * @param {number} userId - Telegram user ID
   * @param {string} phoneNumber - Phone number
   * @returns {Promise<Object>} Processing response
   */
  async processPhoneNumber(userId, phoneNumber) {
    try {
      const user = await User.findByTelegramId(userId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      const currentState = user.registrationState;
      if (!this.isValidTransition(currentState, this.states.PHONE_ENTERED)) {
        return { success: false, error: 'Invalid state transition' };
      }

      // Validate phone number format
      const cleanPhone = this.cleanPhoneNumber(phoneNumber);
      if (!this.isValidPhoneNumber(cleanPhone)) {
        return {
          success: false,
          error: 'Invalid phone number format. Please enter a valid phone number (e.g., +1234567890)',
          keyboard: this.getStateKeyboard(currentState)
        };
      }

      await user.setPhoneNumber(cleanPhone);

      return {
        success: true,
        state: user.registrationState,
        message: this.getStateMessage(user.registrationState),
        keyboard: this.getStateKeyboard(user.registrationState)
      };
    } catch (error) {
      Logger.error('Error processing phone number', { error: error.message, userId });
      return { success: false, error: 'Failed to process phone number' };
    }
  }

  /**
   * Process full name input
   * @param {number} userId - Telegram user ID
   * @param {string} fullName - Full name
   * @returns {Promise<Object>} Processing response
   */
  async processFullName(userId, fullName) {
    try {
      const user = await User.findByTelegramId(userId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      const currentState = user.registrationState;
      if (!this.isValidTransition(currentState, this.states.NAME_ENTERED)) {
        return { success: false, error: 'Invalid state transition' };
      }

      if (!fullName || fullName.trim().length < 2) {
        return {
          success: false,
          error: 'Please enter a valid full name (at least 2 characters)',
          keyboard: this.getStateKeyboard(currentState)
        };
      }

      await user.setFullName(fullName.trim());

      return {
        success: true,
        state: user.registrationState,
        message: this.getStateMessage(user.registrationState),
        keyboard: this.getStateKeyboard(user.registrationState)
      };
    } catch (error) {
      Logger.error('Error processing full name', { error: error.message, userId });
      return { success: false, error: 'Failed to process full name' };
    }
  }

  /**
   * Process role selection
   * @param {number} userId - Telegram user ID
   * @param {string} role - Selected role
   * @returns {Promise<Object>} Processing response
   */
  async processRoleSelection(userId, role) {
    try {
      const user = await User.findByTelegramId(userId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      const currentState = user.registrationState;
      if (!this.isValidTransition(currentState, this.states.ROLE_SELECTED)) {
        return { success: false, error: 'Invalid state transition' };
      }

      if (!['buyer', 'investor', 'both'].includes(role)) {
        return {
          success: false,
          error: 'Invalid role selection',
          keyboard: this.getStateKeyboard(currentState)
        };
      }

      await user.setRole(role);

      return {
        success: true,
        state: user.registrationState,
        message: this.getStateMessage(user.registrationState),
        keyboard: this.getStateKeyboard(user.registrationState)
      };
    } catch (error) {
      Logger.error('Error processing role selection', { error: error.message, userId });
      return { success: false, error: 'Failed to process role selection' };
    }
  }

  /**
   * Show agenda and move to completion
   * @param {number} userId - Telegram user ID
   * @returns {Promise<Object>} Processing response
   */
  async showAgenda(userId) {
    try {
      const user = await User.findByTelegramId(userId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      const currentState = user.registrationState;
      if (!this.isValidTransition(currentState, this.states.AGENDA_VIEWED)) {
        return { success: false, error: 'Invalid state transition' };
      }

      await user.updateRegistrationState(this.states.AGENDA_VIEWED);

      return {
        success: true,
        state: user.registrationState,
        message: this.getStateMessage(user.registrationState),
        keyboard: this.getStateKeyboard(user.registrationState)
      };
    } catch (error) {
      Logger.error('Error showing agenda', { error: error.message, userId });
      return { success: false, error: 'Failed to show agenda' };
    }
  }

  /**
   * Complete registration
   * @param {number} userId - Telegram user ID
   * @returns {Promise<Object>} Processing response
   */
  async completeRegistration(userId) {
    try {
      const user = await User.findByTelegramId(userId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      const currentState = user.registrationState;
      if (!this.isValidTransition(currentState, this.states.COMPLETED)) {
        return { success: false, error: 'Invalid state transition' };
      }

      await user.completeRegistration();

      return {
        success: true,
        state: user.registrationState,
        message: this.getStateMessage(user.registrationState),
        keyboard: this.getStateKeyboard(user.registrationState)
      };
    } catch (error) {
      Logger.error('Error completing registration', { error: error.message, userId });
      return { success: false, error: 'Failed to complete registration' };
    }
  }

  /**
   * Get message for current state
   * @param {string} state - Current state
   * @returns {string} State message
   */
  getStateMessage(state) {
    const messages = {
      [this.states.NOT_STARTED]: `📱 *Welcome to Sochma Bot!*

To get started, I need to collect some information from you. Let's begin with your phone number.

Please enter your phone number in international format (e.g., +1234567890):`,

      [this.states.PHONE_ENTERED]: `👤 *Great! Now let's get your name.*

Please enter your full name:`,

      [this.states.NAME_ENTERED]: `🎯 *Perfect! Now let's determine your role.*

Are you primarily a:
• **Buyer** - Looking to purchase properties
• **Investor** - Looking to invest in real estate
• **Both** - You do both buying and investing`,

      [this.states.ROLE_SELECTED]: `📋 *Bot Agenda & Features*

**Sochma Bot** is designed to connect buyers and investors in the real estate market. Here's what I can help you with:

🏠 **Property Search**: Find properties that match your criteria
💰 **Investment Opportunities**: Discover profitable investment options
🤝 **Networking**: Connect with other buyers and investors
📊 **Market Insights**: Get the latest market trends and data
💬 **Direct Communication**: Chat directly with property owners and investors
🔔 **Notifications**: Stay updated on new opportunities

Ready to complete your registration?`,

      [this.states.AGENDA_VIEWED]: `✅ *Registration Complete!*

Welcome to Sochma, ${this.getUserDisplayName()}!

Your registration details:
📱 Phone: ${this.getUserPhoneNumber()}
👤 Name: ${this.getUserFullName()}
🎯 Role: ${this.getUserRole()}

You can now start using all the bot features. Use /help to see available commands.`
    };

    return messages[state] || 'Unknown state';
  }

  /**
   * Get keyboard for current state
   * @param {string} state - Current state
   * @returns {Object|null} Keyboard object or null
   */
  getStateKeyboard(state) {
    const keyboards = {
      [this.states.ROLE_SELECTED]: {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🏠 Buyer', callback_data: 'role_buyer' },
              { text: '💰 Investor', callback_data: 'role_investor' }
            ],
            [
              { text: '🔄 Both', callback_data: 'role_both' }
            ]
          ]
        }
      },
      [this.states.AGENDA_VIEWED]: {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ Complete Registration', callback_data: 'complete_registration' }
            ]
          ]
        }
      }
    };

    return keyboards[state] || null;
  }

  /**
   * Clean phone number
   * @param {string} phone - Raw phone number
   * @returns {string} Cleaned phone number
   */
  cleanPhoneNumber(phone) {
    return phone.replace(/[^\d+]/g, '');
  }

  /**
   * Validate phone number
   * @param {string} phone - Phone number
   * @returns {boolean} True if valid
   */
  isValidPhoneNumber(phone) {
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Get user display name (placeholder - would need user context)
   * @returns {string} Display name
   */
  getUserDisplayName() {
    return 'User'; // This would be replaced with actual user data in context
  }

  /**
   * Get user phone number (placeholder - would need user context)
   * @returns {string} Phone number
   */
  getUserPhoneNumber() {
    return 'N/A'; // This would be replaced with actual user data in context
  }

  /**
   * Get user full name (placeholder - would need user context)
   * @returns {string} Full name
   */
  getUserFullName() {
    return 'N/A'; // This would be replaced with actual user data in context
  }

  /**
   * Get user role (placeholder - would need user context)
   * @returns {string} Role
   */
  getUserRole() {
    return 'N/A'; // This would be replaced with actual user data in context
  }
}

// Create singleton instance
const registrationFSM = new RegistrationFSM();

module.exports = registrationFSM;
