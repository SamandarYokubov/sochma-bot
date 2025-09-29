import User from '../models/User.js';
import Conversation from '../models/Conversation.js';
import { logUserAction, logBotError } from '../utils/logger.js';

/**
 * Middleware to ensure user exists in database
 */
export const ensureUser = async (ctx, next) => {
  try {
    const telegramUser = ctx.from;
    
    if (!telegramUser) {
      logBotError(new Error('No user data in context'), { context: 'ensureUser' });
      return;
    }

    // Check if user exists in database
    let user = await User.findByTelegramId(telegramUser.id);
    
    if (!user) {
      // Create new user
      user = new User({
        telegramId: telegramUser.id,
        username: telegramUser.username,
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name,
        languageCode: telegramUser.language_code || 'en',
        isBot: telegramUser.is_bot || false,
        isPremium: telegramUser.is_premium || false,
        status: 'active'
      });
      
      await user.save();
      logUserAction(telegramUser.id, 'user_created', { 
        username: telegramUser.username,
        firstName: telegramUser.first_name 
      });
    } else {
      // Update user information if changed
      const updates = {};
      
      if (user.username !== telegramUser.username) {
        updates.username = telegramUser.username;
      }
      if (user.firstName !== telegramUser.first_name) {
        updates.firstName = telegramUser.first_name;
      }
      if (user.lastName !== telegramUser.last_name) {
        updates.lastName = telegramUser.last_name;
      }
      if (user.isPremium !== (telegramUser.is_premium || false)) {
        updates.isPremium = telegramUser.is_premium || false;
      }
      
      if (Object.keys(updates).length > 0) {
        Object.assign(user, updates);
        await user.save();
        logUserAction(telegramUser.id, 'user_updated', updates);
      }
      
      // Update last activity
      await user.updateLastActivity();
    }

    // Add user to context
    ctx.user = user;
    ctx.telegramUser = telegramUser;
    
    await next();
  } catch (error) {
    logBotError(error, { 
      context: 'ensureUser',
      telegramId: ctx.from?.id 
    });
    
    // Continue execution even if user creation fails
    await next();
  }
};

/**
 * Middleware to check if user is active
 */
export const requireActiveUser = async (ctx, next) => {
  if (!ctx.user) {
    await ctx.reply('❌ User not found. Please start the bot with /start');
    return;
  }

  if (ctx.user.status !== 'active') {
    const statusMessages = {
      'inactive': '❌ Your account is inactive. Please contact support.',
      'banned': '🚫 Your account has been banned. Please contact support.',
      'pending_verification': '⏳ Your account is pending verification. Please wait for approval.'
    };
    
    await ctx.reply(statusMessages[ctx.user.status] || '❌ Account access denied.');
    return;
  }

  await next();
};

/**
 * Middleware to check user permissions
 */
export const requirePermission = (requiredPermission) => {
  return async (ctx, next) => {
    if (!ctx.user) {
      await ctx.reply('❌ User not found. Please start the bot with /start');
      return;
    }

    if (!ctx.user.canAccessFeature(requiredPermission)) {
      await ctx.reply(
        `❌ You don't have permission to access this feature.\n` +
        `Required: ${requiredPermission}\n` +
        `Your plan: ${ctx.user.subscription.plan}`
      );
      return;
    }

    await next();
  };
};

/**
 * Middleware to check user type
 */
export const requireUserType = (requiredTypes) => {
  const types = Array.isArray(requiredTypes) ? requiredTypes : [requiredTypes];
  
  return async (ctx, next) => {
    if (!ctx.user) {
      await ctx.reply('❌ User not found. Please start the bot with /start');
      return;
    }

    if (!types.includes(ctx.user.userType)) {
      await ctx.reply(
        `❌ This feature is only available for: ${types.join(', ')}\n` +
        `Your type: ${ctx.user.userType}\n` +
        `Use /profile to update your user type.`
      );
      return;
    }

    await next();
  };
};

/**
 * Middleware to track conversation state
 */
export const trackConversation = async (ctx, next) => {
  try {
    if (!ctx.user) {
      await next();
      return;
    }

    const conversationType = ctx.updateType;
    const command = ctx.message?.text?.split(' ')[0] || 
                   ctx.callbackQuery?.data?.split('_')[0] || 
                   conversationType;

    // Find or create active conversation
    let conversation = await Conversation.findActiveByTelegramId(ctx.user.telegramId);
    
    if (!conversation) {
      conversation = await Conversation.createConversation(
        ctx.user._id,
        ctx.user.telegramId,
        conversationType,
        command,
        { messageId: ctx.message?.message_id || ctx.callbackQuery?.message?.message_id }
      );
    } else {
      // Update existing conversation
      conversation.type = conversationType;
      conversation.command = command;
      conversation.data = {
        ...conversation.data,
        messageId: ctx.message?.message_id || ctx.callbackQuery?.message?.message_id
      };
      await conversation.updateInteraction();
    }

    ctx.conversation = conversation;
    await next();
  } catch (error) {
    logBotError(error, { 
      context: 'trackConversation',
      telegramId: ctx.user?.telegramId 
    });
    await next();
  }
};

/**
 * Middleware to handle rate limiting
 */
export const rateLimit = (maxRequests = 20, windowMs = 900000) => {
  const requests = new Map();
  
  return async (ctx, next) => {
    const userId = ctx.user?.telegramId || ctx.from?.id;
    
    if (!userId) {
      await next();
      return;
    }

    const now = Date.now();
    const userRequests = requests.get(userId) || [];
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
      await ctx.reply(
        `⏳ Rate limit exceeded. Please wait ${Math.ceil(windowMs / 60000)} minutes before trying again.`
      );
      return;
    }
    
    // Add current request
    validRequests.push(now);
    requests.set(userId, validRequests);
    
    await next();
  };
};

/**
 * Middleware to log user actions
 */
export const logActions = async (ctx, next) => {
  const startTime = Date.now();
  
  try {
    await next();
    
    const duration = Date.now() - startTime;
    const action = ctx.message?.text || 
                  ctx.callbackQuery?.data || 
                  ctx.updateType || 
                  'unknown';
    
    logUserAction(
      ctx.user?.telegramId || ctx.from?.id,
      'action_completed',
      {
        action,
        duration: `${duration}ms`,
        success: true
      }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logUserAction(
      ctx.user?.telegramId || ctx.from?.id,
      'action_failed',
      {
        action: ctx.message?.text || ctx.callbackQuery?.data || ctx.updateType,
        duration: `${duration}ms`,
        error: error.message,
        success: false
      }
    );
    
    throw error;
  }
};
