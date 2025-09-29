const { Telegraf, Scenes, session } = require('telegraf');
const config = require('../config');
const Logger = require('../utils/logger');
const memoryStorage = require('./memoryStorage');
const RegistrationHandler = require('../handlers/registrationHandler');
const User = require('../models/User');

class BotService {
  constructor() {
    this.bot = null;
    this.isRunning = false;
    this.registrationHandler = null;
    this.stage = null;
  }

  /**
   * Initialize and start the bot
   */
  async start() {
    try {
      // Create bot instance with telegraf
      this.bot = new Telegraf(config.bot.token);
      
      // Initialize registration handler
      this.registrationHandler = new RegistrationHandler(this.bot);
      
      // Set up middleware
      this.setupMiddleware();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Set up commands
      this.setupCommands();
      
      // Start the bot
      if (config.env === 'production') {
        // Use webhook in production
        await this.bot.launch({
          webhook: {
            domain: process.env.WEBHOOK_DOMAIN,
            port: config.port
          }
        });
      } else {
        // Use polling in development
        await this.bot.launch();
      }
      
      this.isRunning = true;
      Logger.info('Bot started successfully with Telegraf', { 
        username: config.bot.username,
        name: config.bot.name,
        mode: config.env === 'production' ? 'webhook' : 'polling'
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
      await this.bot.stop();
      this.isRunning = false;
      Logger.info('Bot stopped');
    }
  }

  /**
   * Set up middleware
   */
  setupMiddleware() {
    // Session middleware for state management
    this.bot.use(session());
    
    // User middleware - store user information
    this.bot.use(async (ctx, next) => {
      try {
        const userId = ctx.from.id;
        const userData = ctx.from;
        const chatData = ctx.chat;
        
        // Store user information
        await memoryStorage.setUser(userId, userData, chatData);
        
        // Add user to context
        ctx.user = memoryStorage.getUser(userId);
        
        Logger.debug('User middleware processed', { 
          userId, 
          username: userData.username,
          chatId: chatData.id
        });
        
        await next();
      } catch (error) {
        Logger.error('Error in user middleware', { error: error.message });
        await next();
      }
    });
    
    // Registration middleware - check if user is in registration
    this.bot.use(async (ctx, next) => {
      try {
        const userId = ctx.from.id;
        const isInRegistration = await this.registrationHandler.isInRegistration(userId);
        const currentState = await this.registrationHandler.getCurrentState(userId);
        
        // Add registration state to context
        ctx.registrationState = currentState;
        ctx.isInRegistration = isInRegistration;
        
        // If user is in registration and message is text, handle registration
        if (isInRegistration && ctx.message && ctx.message.text) {
          await this.handleRegistrationMessage(ctx, currentState);
          return; // Don't continue to other handlers
        }
        
        await next();
      } catch (error) {
        Logger.error('Error in registration middleware', { error: error.message });
        await next();
      }
    });
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Handle errors
    this.bot.catch((err, ctx) => {
      Logger.error('Bot error', { 
        error: err.message,
        userId: ctx.from?.id,
        chatId: ctx.chat?.id
      });
    });
    
    Logger.info('Event listeners set up');
  }

  /**
   * Set up commands
   */
  setupCommands() {
    // Start command
    this.bot.start(async (ctx) => {
      await this.sendStartMessage(ctx);
    });

    // Register command
    this.bot.command('register', async (ctx) => {
      await this.registrationHandler.handleRegistrationStart(ctx);
    });

    // Hello command
    this.bot.hears(['/hello', 'hello', 'hi'], async (ctx) => {
      await this.sendHelloMessage(ctx);
    });

    // Help command
    this.bot.help(async (ctx) => {
      await this.sendHelpMessage(ctx);
    });

    // Stats command
    this.bot.command('stats', async (ctx) => {
      await this.sendStatsMessage(ctx);
    });

    // Info command
    this.bot.command('info', async (ctx) => {
      await this.sendUserInfo(ctx);
    });

    // Handle callback queries
    this.bot.on('callback_query', async (ctx) => {
      await this.handleCallbackQuery(ctx);
    });

    // Handle text messages
    this.bot.on('text', async (ctx) => {
      await this.sendDefaultMessage(ctx);
    });

    // Handle photos
    this.bot.on('photo', async (ctx) => {
      await this.handlePhotoMessage(ctx);
    });

    // Handle stickers
    this.bot.on('sticker', async (ctx) => {
      await this.handleStickerMessage(ctx);
    });

    Logger.info('Commands set up');
  }

  /**
   * Handle registration messages
   * @param {Object} ctx - Telegraf context
   * @param {string} currentState - Current registration state
   */
  async handleRegistrationMessage(ctx, currentState) {
    const text = ctx.message.text.trim();

    switch (currentState) {
      case 'not_started':
        // User is starting registration, ask for phone number
        await this.registrationHandler.handlePhoneNumberInput(ctx);
        break;
      case 'phone_entered':
        // User entered phone, now ask for name
        await this.registrationHandler.handleFullNameInput(ctx);
        break;
      case 'name_entered':
        // This should be handled by role selection buttons, but fallback to text
        await ctx.reply('Please use the buttons below to select your role.');
        break;
      default:
        await ctx.reply('Please complete the registration process first.');
    }
  }

  /**
   * Handle callback queries
   * @param {Object} ctx - Telegraf context
   */
  async handleCallbackQuery(ctx) {
    const data = ctx.callbackQuery.data;

    // Handle registration callbacks
    if (data.startsWith('role_')) {
      await this.registrationHandler.handleRoleSelection(ctx);
      return;
    }

    if (data === 'complete_registration') {
      await this.registrationHandler.handleRegistrationCompletion(ctx);
      return;
    }

    // Handle different callback data
    switch (data) {
      case 'get_info':
        await this.sendUserInfo(ctx);
        break;
      case 'get_stats':
        await this.sendStatsMessage(ctx);
        break;
      case 'start_registration':
        await this.registrationHandler.handleRegistrationStart(ctx);
        break;
      default:
        await ctx.reply('Button clicked!');
    }
  }

  /**
   * Send start message
   * @param {Object} ctx - Telegraf context
   */
  async sendStartMessage(ctx) {
    const user = ctx.user;
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

      await ctx.reply(welcomeText, keyboard);
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

      await ctx.reply(welcomeText, keyboard);
    }
  }

  /**
   * Send hello message
   * @param {Object} ctx - Telegraf context
   */
  async sendHelloMessage(ctx) {
    const user = ctx.user;
    const greetings = [
      `Hello ${user?.firstName || 'there'}! 👋`,
      `Hi ${user?.firstName || 'friend'}! How are you? 😊`,
      `Hey ${user?.firstName || 'buddy'}! Nice to see you! 🎉`,
      `Greetings ${user?.firstName || 'stranger'}! Welcome! 🌟`
    ];
    
    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    await ctx.reply(randomGreeting);
  }

  /**
   * Send help message
   * @param {Object} ctx - Telegraf context
   */
  async sendHelpMessage(ctx) {
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

    await ctx.reply(helpText, { parse_mode: 'Markdown' });
  }

  /**
   * Send stats message
   * @param {Object} ctx - Telegraf context
   */
  async sendStatsMessage(ctx) {
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

    await ctx.reply(statsText, { parse_mode: 'Markdown' });
  }

  /**
   * Send user info
   * @param {Object} ctx - Telegraf context
   */
  async sendUserInfo(ctx) {
    const user = ctx.user;
    if (!user) {
      await ctx.reply('❌ User information not found.');
      return;
    }

    const userText = `ℹ️ *Your Information*

🆔 ID: \`${user.id}\`
👤 Name: ${user.firstName || 'Not provided'} ${user.lastName || ''}
🏷️ Username: @${user.username || 'Not set'}
🌍 Language: ${user.languageCode || 'Unknown'}
🤖 Is Bot: ${user.isBot ? 'Yes' : 'No'}
📅 First Seen: ${user.createdAt.toLocaleDateString()}
👀 Last Seen: ${user.lastSeen.toLocaleString()}
💬 Messages: ${user.messageCount}`;

    if (user.isRegistered) {
      userText += `\n\n📱 Phone: ${user.phoneNumber || 'Not provided'}
👤 Full Name: ${user.userFullName || 'Not provided'}
🎯 Role: ${user.role || 'Not selected'}
✅ Registration: Completed`;
    } else {
      userText += `\n\n⚠️ Registration: Not completed`;
    }

    await ctx.reply(userText, { parse_mode: 'Markdown' });
  }

  /**
   * Handle photo messages
   * @param {Object} ctx - Telegraf context
   */
  async handlePhotoMessage(ctx) {
    await ctx.reply('📸 Nice photo! Thanks for sharing!');
  }

  /**
   * Handle sticker messages
   * @param {Object} ctx - Telegraf context
   */
  async handleStickerMessage(ctx) {
    await ctx.reply('😄 Cool sticker!');
  }

  /**
   * Send default message
   * @param {Object} ctx - Telegraf context
   */
  async sendDefaultMessage(ctx) {
    const user = ctx.user;
    const responses = [
      `Thanks for your message, ${user?.firstName || 'friend'}! 😊`,
      `I heard you, ${user?.firstName || 'buddy'}! What else can I help with? 🤔`,
      `Got it, ${user?.firstName || 'there'}! Try /help for more options! 💡`,
      `Message received, ${user?.firstName || 'friend'}! Thanks! 🙏`
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    await ctx.reply(randomResponse);
  }
}

module.exports = BotService;