import { logUserAction } from '../utils/logger.js';

/**
 * Handle /start command
 */
export const startHandler = async (ctx) => {
  try {
    const user = ctx.user;
    const isNewUser = user.accountAge === 0;

    logUserAction(user.telegramId, 'start_command', { isNewUser });

    if (isNewUser) {
      await ctx.reply(
        `🎉 Welcome to Sochma Bot, ${user.firstName}!\n\n` +
        `I'm here to help you connect with investors and buyers in the Sochma ecosystem.\n\n` +
        `Let's get started by setting up your profile. What type of user are you?`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '🏢 I\'m an Investor', callback_data: 'user_type_investor' },
                { text: '🛒 I\'m a Buyer', callback_data: 'user_type_buyer' }
              ],
              [
                { text: '🔄 I\'m Both', callback_data: 'user_type_both' }
              ]
            ]
          }
        }
      );
    } else {
      await ctx.reply(
        `👋 Welcome back, ${user.firstName}!\n\n` +
        `Your profile: ${user.userType}\n` +
        `Account age: ${user.accountAge} days\n\n` +
        `What would you like to do today?`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '👤 My Profile', callback_data: 'profile_view' },
                { text: '🔍 Search', callback_data: 'search_menu' }
              ],
              [
                { text: '📊 Dashboard', callback_data: 'dashboard' },
                { text: '⚙️ Settings', callback_data: 'settings' }
              ],
              [
                { text: '❓ Help', callback_data: 'help' }
              ]
            ]
          }
        }
      );
    }
  } catch (error) {
    logUserAction(ctx.user?.telegramId, 'start_command_error', { error: error.message });
    await ctx.reply('❌ An error occurred. Please try again.');
  }
};

/**
 * Handle user type selection
 */
export const handleUserTypeSelection = async (ctx) => {
  try {
    const userType = ctx.callbackQuery.data.split('_')[2]; // user_type_investor -> investor
    const user = ctx.user;

    user.userType = userType;
    await user.save();

    logUserAction(user.telegramId, 'user_type_selected', { userType });

    await ctx.answerCbQuery(`✅ You've been set as ${userType}!`);
    
    await ctx.editMessageText(
      `Great! You're now registered as a ${userType}.\n\n` +
      `Let's complete your profile setup. Please provide the following information:\n\n` +
      `1. Company/Organization name\n` +
      `2. Industry\n` +
      `3. Location\n` +
      `4. Brief bio\n\n` +
      `You can update this information anytime using /profile command.`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📝 Complete Profile', callback_data: 'profile_setup' },
              { text: '⏭️ Skip for Now', callback_data: 'profile_skip' }
            ]
          ]
        }
      }
    );
  } catch (error) {
    logUserAction(ctx.user?.telegramId, 'user_type_selection_error', { error: error.message });
    await ctx.answerCbQuery('❌ Error setting user type. Please try again.');
  }
};

/**
 * Handle profile setup
 */
export const handleProfileSetup = async (ctx) => {
  try {
    const user = ctx.user;
    
    await ctx.answerCbQuery();
    
    await ctx.editMessageText(
      `📝 Let's set up your profile, ${user.firstName}!\n\n` +
      `Please send me the following information one by one:\n\n` +
      `1️⃣ Company/Organization name\n` +
      `2️⃣ Industry\n` +
      `3️⃣ Location\n` +
      `4️⃣ Brief bio (max 500 characters)\n\n` +
      `Type "skip" to skip any field.\n\n` +
      `Let's start with your company name:`
    );

    // Set conversation state for profile setup
    if (ctx.conversation) {
      ctx.conversation.state = 'profile_setup';
      ctx.conversation.step = 1;
      await ctx.conversation.save();
    }

  } catch (error) {
    logUserAction(ctx.user?.telegramId, 'profile_setup_error', { error: error.message });
    await ctx.answerCbQuery('❌ Error starting profile setup. Please try again.');
  }
};

/**
 * Handle profile skip
 */
export const handleProfileSkip = async (ctx) => {
  try {
    await ctx.answerCbQuery('✅ Profile setup skipped');
    
    await ctx.editMessageText(
      `🎉 Welcome to Sochma Bot!\n\n` +
      `You can complete your profile anytime using /profile command.\n\n` +
      `For now, you can:\n` +
      `• Search for ${ctx.user.userType}s using /search\n` +
      `• View your profile using /profile\n` +
      `• Get help using /help\n\n` +
      `Happy connecting! 🚀`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🔍 Start Searching', callback_data: 'search_menu' },
              { text: '❓ Get Help', callback_data: 'help' }
            ]
          ]
        }
      }
    );
  } catch (error) {
    logUserAction(ctx.user?.telegramId, 'profile_skip_error', { error: error.message });
    await ctx.answerCbQuery('❌ Error skipping profile setup. Please try again.');
  }
};
