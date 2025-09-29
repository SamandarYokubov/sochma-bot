const TelegramBot = require('node-telegram-bot-api');
const config = require('../config');
const Logger = require('../utils/logger');
const memoryStorage = require('./memoryStorage');
const RegistrationHandler = require('../handlers/registrationHandler');
const User = require('../models/User');
import express from "express";

class BotService {
  constructor() {
    this.bot = null;
    this.isRunning = false;
    this.registrationHandler = null;
  }

  /**
   * Initialize and start the bot
   */
  async start() {
    try {
      // Create bot instance
      this.bot = new TelegramBot(config.bot.token);

      const app = express();
      app.use(express.json());

      // Bind webhook endpoint
      app.use(bot.webhookCallback("/webhook"));

      // Set webhook on Telegram side
      await bot.telegram.setWebhook("https://sochma.uz/webhook");

      // If you also want website routes
      app.get("/", (req, res) => {
        res.send("Hello from my website!");
      });

      // Run express server (listen on internal port)
      app.listen(3000, () => {
        console.log("Bot/website server running on port 3000");
      });
            
      // Initialize registration handler
      this.registrationHandler = new RegistrationHandler(this.bot);
      
      // Set up event listeners
      this.setupEventListeners();
      
      this.isRunning = true;
      Logger.info('Bot started successfully', { 
        username: config.bot.username,
        name: config.bot.name 
      });
      
      return this.bot;
    } catch (error) {
      Logger.error('Failed to start bot', { error: error.message });
      throw error;
    }
  }

  /**
   * Stop the bot
   */
  async stop() {
    if (this.bot && this.isRunning) {
      await this.bot.stopPolling();
      this.isRunning = false;
      Logger.info('Bot stopped');
    }
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Handle errors
    this.bot.on('error', (error) => {
      Logger.error('Bot error', { error: error.message });
    });

    // Handle polling errors
    this.bot.on('polling_error', (error) => {
      Logger.error('Polling error', { error: error.message });
    });

    // Handle text messages
    this.bot.on('message', (msg) => {
      this.handleMessage(msg);
    });

    // Handle callback queries (inline keyboard buttons)
    this.bot.on('callback_query', (callbackQuery) => {
      this.handleCallbackQuery(callbackQuery);
    });

    Logger.info('Event listeners set up');
  }

  /**
   * Handle incoming messages
   * @param {Object} msg - Telegram message object
   */
  async handleMessage(msg) {
    try {
      const chatId = msg.chat.id;
      const userId = msg.from.id;
      const text = msg.text;

      // Store user information
      await memoryStorage.setUser(userId, msg.from, msg.chat);

      Logger.debug('Message received', { 
        chatId, 
        userId, 
        username: msg.from.username,
        text: text?.substring(0, 100) // Log first 100 chars
      });

      // Check if user is in registration process
      const isInRegistration = await this.registrationHandler.isInRegistration(userId);
      const currentState = await this.registrationHandler.getCurrentState(userId);

      // Handle registration flow if user is in registration
      if (isInRegistration && text) {
        await this.handleRegistrationMessage(msg, currentState);
        return;
      }

      // Handle different message types
      if (text) {
        await this.handleTextMessage(msg);
      } else if (msg.photo) {
        await this.handlePhotoMessage(msg);
      } else if (msg.sticker) {
        await this.handleStickerMessage(msg);
      } else {
        await this.handleOtherMessage(msg);
      }

    } catch (error) {
      Logger.error('Error handling message', { 
        error: error.message,
        chatId: msg.chat.id,
        userId: msg.from.id
      });
    }
  }

  /**
   * Handle registration messages
   * @param {Object} msg - Telegram message object
   * @param {string} currentState - Current registration state
   */
  async handleRegistrationMessage(msg, currentState) {
    const text = msg.text.trim();

    switch (currentState) {
      case 'not_started':
        // User is starting registration, ask for phone number
        await this.registrationHandler.handlePhoneNumberInput(msg);
        break;
      case 'phone_entered':
        // User entered phone, now ask for name
        await this.registrationHandler.handleFullNameInput(msg);
        break;
      case 'name_entered':
        // This should be handled by role selection buttons, but fallback to text
        await this.bot.sendMessage(msg.chat.id, 'Please use the buttons below to select your role.');
        break;
      default:
        await this.bot.sendMessage(msg.chat.id, 'Please complete the registration process first.');
    }
  }

  /**
   * Handle text messages
   * @param {Object} msg - Telegram message object
   */
  async handleTextMessage(msg) {
    const chatId = msg.chat.id;
    const text = msg.text.toLowerCase().trim();
    const user = memoryStorage.getUser(msg.from.id);

    // Handle different commands
    switch (text) {
      case '/start':
        await this.sendStartMessage(chatId, user);
        break;
      case '/register':
        await this.registrationHandler.handleRegistrationStart(msg);
        break;
      case '/hello':
      case 'hello':
      case 'hi':
        await this.sendHelloMessage(chatId, user);
        break;
      case '/help':
        await this.sendHelpMessage(chatId);
        break;
      case '/stats':
        await this.sendStatsMessage(chatId);
        break;
      case '/info':
        await this.sendUserInfo(chatId, user);
        break;
      default:
        await this.sendDefaultMessage(chatId, user);
    }
  }

  /**
   * Handle photo messages
   * @param {Object} msg - Telegram message object
   */
  async handlePhotoMessage(msg) {
    const chatId = msg.chat.id;
    await this.bot.sendMessage(chatId, '📸 Nice photo! Thanks for sharing!');
  }

  /**
   * Handle sticker messages
   * @param {Object} msg - Telegram message object
   */
  async handleStickerMessage(msg) {
    const chatId = msg.chat.id;
    await this.bot.sendMessage(chatId, '😄 Cool sticker!');
  }

  /**
   * Handle other message types
   * @param {Object} msg - Telegram message object
   */
  async handleOtherMessage(msg) {
    const chatId = msg.chat.id;
    await this.bot.sendMessage(chatId, 'I received your message! Thanks! 😊');
  }

  /**
   * Handle callback queries
   * @param {Object} callbackQuery - Telegram callback query object
   */
  async handleCallbackQuery(callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;

    // Answer the callback query
    await this.bot.answerCallbackQuery(callbackQuery.id);

    // Handle registration callbacks
    if (data.startsWith('role_')) {
      await this.registrationHandler.handleRoleSelection(callbackQuery);
      return;
    }

    if (data === 'complete_registration') {
      await this.registrationHandler.handleRegistrationCompletion(callbackQuery);
      return;
    }

    // Handle different callback data
    switch (data) {
      case 'get_info':
        const user = memoryStorage.getUser(callbackQuery.from.id);
        await this.sendUserInfo(chatId, user);
        break;
      case 'get_stats':
        await this.sendStatsMessage(chatId);
        break;
      case 'start_registration':
        await this.registrationHandler.handleRegistrationStart(callbackQuery.message);
        break;
      default:
        await this.bot.sendMessage(chatId, 'Button clicked!');
    }
  }

  /**
   * Send start message
   */
  async sendStartMessage(chatId, user) {
    // Check if user is registered
    const isRegistered = user && user.isRegistered;
    
    if (isRegistered) {
      const welcomeText = `👋 Welcome back, ${user.userFullName || user.firstName || 'there'}! 

You're already registered and ready to use all features of ${config.bot.name}.

Here's what you can do:
• Search properties 🔍
• Find investments 💰
• Network with others 🤝
• View market data 📊
• Manage your profile ℹ️

Use the buttons below or type /help for more options!`;

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

      await this.bot.sendMessage(chatId, welcomeText, keyboard);
    } else {
      const welcomeText = `👋 Hello ${user?.firstName || 'there'}! 

Welcome to ${config.bot.name}! I'm your real estate assistant that connects buyers and investors.

To get started, you'll need to complete a quick registration process where I'll collect:
• Your phone number 📱
• Your full name 👤
• Your role (Buyer/Investor) 🎯

This will help me provide you with personalized real estate opportunities and connect you with the right people.

Ready to get started?`;

      const keyboard = {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🚀 Start Registration', callback_data: 'start_registration' }
            ],
            [
              { text: 'ℹ️ Learn More', callback_data: 'learn_more' },
              { text: '❓ Help', callback_data: 'help' }
            ]
          ]
        }
      };

      await this.bot.sendMessage(chatId, welcomeText, keyboard);
    }
  }

  /**
   * Send hello message
   */
  async sendHelloMessage(chatId, user) {
    const greetings = [
      `Hello ${user.firstName || 'there'}! 👋`,
      `Hi ${user.firstName || 'friend'}! How are you? 😊`,
      `Hey ${user.firstName || 'buddy'}! Nice to see you! 🎉`,
      `Greetings ${user.firstName || 'stranger'}! Welcome! 🌟`
    ];
    
    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    await this.bot.sendMessage(chatId, randomGreeting);
  }

  /**
   * Send help message
   */
  async sendHelpMessage(chatId) {
    const helpText = `🤖 *${config.bot.name} Help*

*Available Commands:*
/start - Start the bot and see welcome message
/register - Start or continue registration process
/hello - Get a friendly greeting
/help - Show this help message
/stats - Show bot statistics
/info - Show your information

*Registration Process:*
1. 📱 Enter your phone number
2. 👤 Enter your full name
3. 🎯 Select your role (Buyer/Investor/Both)
4. 📋 Review bot features and agenda
5. ✅ Complete registration

*What I can do:*
• Connect buyers and investors
• Search properties and investments
• Provide market insights
• Enable networking between users
• Remember your information securely

Just send me any message and I'll respond! 😊`;

    await this.bot.sendMessage(chatId, helpText, { parse_mode: 'Markdown' });
  }

  /**
   * Send stats message
   */
  async sendStatsMessage(chatId) {
    const stats = memoryStorage.getStats();
    const mongoStats = await memoryStorage.getMongoStats();
    
    let statsText = `📊 *Bot Statistics*

👥 Total Users: ${stats.totalUsers}
🟢 Active Users: ${stats.activeUsers}
💬 Messages Processed: ${stats.messagesProcessed}
⏱️ Uptime: ${Math.floor(stats.uptime / 60)} minutes
💾 Memory Usage: ${Math.round(stats.memoryUsage.heapUsed / 1024 / 1024)} MB`;

    if (mongoStats) {
      statsText += `\n\n🗄️ *Database Statistics*
📊 Total DB Users: ${mongoStats.users.totalUsers || 0}
🟢 Active DB Users: ${mongoStats.users.activeUsers || 0}
💬 Total DB Messages: ${mongoStats.users.totalMessages || 0}
📈 Avg Messages/User: ${Math.round(mongoStats.users.averageMessages || 0)}`;
    }

    await this.bot.sendMessage(chatId, statsText, { parse_mode: 'Markdown' });
  }

  /**
   * Send user info
   */
  async sendUserInfo(chatId, user) {
    const userText = `ℹ️ *Your Information*

🆔 ID: \`${user.id}\`
👤 Name: ${user.firstName || 'Not provided'} ${user.lastName || ''}
🏷️ Username: @${user.username || 'Not set'}
🌍 Language: ${user.languageCode || 'Unknown'}
🤖 Is Bot: ${user.isBot ? 'Yes' : 'No'}
📅 First Seen: ${user.createdAt.toLocaleDateString()}
👀 Last Seen: ${user.lastSeen.toLocaleString()}
💬 Messages: ${user.messageCount}`;

    await this.bot.sendMessage(chatId, userText, { parse_mode: 'Markdown' });
  }

  /**
   * Send default message
   */
  async sendDefaultMessage(chatId, user) {
    const responses = [
      `Thanks for your message, ${user.firstName || 'friend'}! 😊`,
      `I heard you, ${user.firstName || 'buddy'}! What else can I help with? 🤔`,
      `Got it, ${user.firstName || 'there'}! Try /help for more options! 💡`,
      `Message received, ${user.firstName || 'friend'}! Thanks! 🙏`
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    await this.bot.sendMessage(chatId, randomResponse);
  }
}

module.exports = BotService;
