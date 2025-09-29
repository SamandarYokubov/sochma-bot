import { logBotError } from '../utils/logger.js';

/**
 * Global error handler middleware
 */
export const errorHandler = async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    logBotError(error, {
      context: 'errorHandler',
      telegramId: ctx.from?.id,
      updateType: ctx.updateType,
      message: ctx.message?.text || ctx.callbackQuery?.data
    });

    // Handle different types of errors
    if (error.code === 'ETELEGRAM') {
      await handleTelegramError(ctx, error);
    } else if (error.name === 'ValidationError') {
      await handleValidationError(ctx, error);
    } else if (error.name === 'CastError') {
      await handleCastError(ctx, error);
    } else if (error.code === 11000) {
      await handleDuplicateKeyError(ctx, error);
    } else {
      await handleGenericError(ctx, error);
    }
  }
};

/**
 * Handle Telegram API errors
 */
const handleTelegramError = async (ctx, error) => {
  const errorMessages = {
    400: '❌ Bad request. Please check your input and try again.',
    401: '❌ Unauthorized. Please contact support.',
    403: '❌ Forbidden. You may not have permission to perform this action.',
    404: '❌ Not found. The requested resource was not found.',
    429: '⏳ Rate limit exceeded. Please wait a moment and try again.',
    500: '❌ Server error. Please try again later.'
  };

  const message = errorMessages[error.response?.error_code] || 
                 '❌ An error occurred. Please try again later.';

  try {
    await ctx.reply(message);
  } catch (replyError) {
    logBotError(replyError, { context: 'handleTelegramError' });
  }
};

/**
 * Handle validation errors
 */
const handleValidationError = async (ctx, error) => {
  const message = '❌ Invalid input. Please check your data and try again.';
  
  try {
    await ctx.reply(message);
  } catch (replyError) {
    logBotError(replyError, { context: 'handleValidationError' });
  }
};

/**
 * Handle cast errors (invalid data types)
 */
const handleCastError = async (ctx, error) => {
  const message = '❌ Invalid data format. Please try again.';
  
  try {
    await ctx.reply(message);
  } catch (replyError) {
    logBotError(replyError, { context: 'handleCastError' });
  }
};

/**
 * Handle duplicate key errors
 */
const handleDuplicateKeyError = async (ctx, error) => {
  const message = '❌ This information already exists. Please use different data.';
  
  try {
    await ctx.reply(message);
  } catch (replyError) {
    logBotError(replyError, { context: 'handleDuplicateKeyError' });
  }
};

/**
 * Handle generic errors
 */
const handleGenericError = async (ctx, error) => {
  const message = '❌ An unexpected error occurred. Please try again later.';
  
  try {
    await ctx.reply(message);
  } catch (replyError) {
    logBotError(replyError, { context: 'handleGenericError' });
  }
};

/**
 * Middleware to handle unhandled promise rejections
 */
export const handleUnhandledRejection = () => {
  process.on('unhandledRejection', (reason, promise) => {
    logBotError(new Error(`Unhandled Rejection: ${reason}`), {
      context: 'unhandledRejection',
      promise: promise.toString()
    });
  });
};

/**
 * Middleware to handle uncaught exceptions
 */
export const handleUncaughtException = () => {
  process.on('uncaughtException', (error) => {
    logBotError(error, { context: 'uncaughtException' });
    
    // Graceful shutdown
    process.exit(1);
  });
};

/**
 * Middleware to handle SIGTERM and SIGINT signals
 */
export const handleGracefulShutdown = (bot) => {
  const gracefulShutdown = (signal) => {
    console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
    
    bot.stop(signal)
      .then(() => {
        console.log('Bot stopped gracefully');
        process.exit(0);
      })
      .catch((error) => {
        console.error('Error during graceful shutdown:', error);
        process.exit(1);
      });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
};

/**
 * Middleware to validate required environment variables
 */
export const validateEnvironment = () => {
  const requiredVars = [
    'BOT_TOKEN',
    'BOT_USERNAME',
    'MONGODB_URI',
    'SOCHMA_API_URL',
    'SOCHMA_API_KEY',
    'JWT_SECRET',
    'ENCRYPTION_KEY'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    const error = new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    logBotError(error, { context: 'validateEnvironment' });
    throw error;
  }
};

/**
 * Middleware to add request timeout
 */
export const requestTimeout = (timeoutMs = 30000) => {
  return async (ctx, next) => {
    const timeout = setTimeout(() => {
      if (!ctx.responseSent) {
        ctx.reply('⏳ Request timeout. Please try again.')
          .catch(error => logBotError(error, { context: 'requestTimeout' }));
      }
    }, timeoutMs);

    try {
      await next();
    } finally {
      clearTimeout(timeout);
    }
  };
};
