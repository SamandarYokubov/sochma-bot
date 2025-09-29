import { logUserAction } from '../utils/logger.js';

/**
 * Handle /profile command
 */
export const profileHandler = async (ctx) => {
  try {
    const user = ctx.user;
    
    logUserAction(user.telegramId, 'profile_view', { userType: user.userType });

    const profileText = formatUserProfile(user);
    
    await ctx.reply(profileText, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✏️ Edit Profile', callback_data: 'profile_edit' },
            { text: '🔄 Change User Type', callback_data: 'profile_change_type' }
          ],
          [
            { text: '📊 View Stats', callback_data: 'profile_stats' },
            { text: '⚙️ Privacy Settings', callback_data: 'profile_privacy' }
          ],
          [
            { text: '🔙 Back to Menu', callback_data: 'main_menu' }
          ]
        ]
      }
    });
  } catch (error) {
    logUserAction(ctx.user?.telegramId, 'profile_view_error', { error: error.message });
    await ctx.reply('❌ Error loading profile. Please try again.');
  }
};

/**
 * Format user profile for display
 */
const formatUserProfile = (user) => {
  const profile = user.profile || {};
  const subscription = user.subscription || {};
  
  let text = `👤 **${user.fullName}**\n\n`;
  
  // Basic info
  text += `🆔 **User ID:** ${user.telegramId}\n`;
  text += `👥 **Type:** ${user.userType}\n`;
  text += `📅 **Joined:** ${user.joinedAt.toLocaleDateString()}\n`;
  text += `🕒 **Last Active:** ${user.lastActivity.toLocaleDateString()}\n\n`;
  
  // Profile details
  if (profile.company) text += `🏢 **Company:** ${profile.company}\n`;
  if (profile.industry) text += `🏭 **Industry:** ${profile.industry}\n`;
  if (profile.location) text += `📍 **Location:** ${profile.location}\n`;
  if (profile.experience) text += `💼 **Experience:** ${profile.experience}\n`;
  if (profile.investmentRange) text += `💰 **Investment Range:** ${profile.investmentRange}\n`;
  if (profile.bio) text += `📝 **Bio:** ${profile.bio}\n`;
  if (profile.website) text += `🌐 **Website:** ${profile.website}\n`;
  if (profile.linkedin) text += `💼 **LinkedIn:** ${profile.linkedin}\n`;
  
  // Subscription info
  text += `\n📊 **Subscription:** ${subscription.plan || 'free'}\n`;
  if (subscription.expiresAt) {
    text += `⏰ **Expires:** ${subscription.expiresAt.toLocaleDateString()}\n`;
  }
  
  // Status
  text += `\n✅ **Status:** ${user.status}\n`;
  if (user.verificationStatus?.isVerified) {
    text += `🔒 **Verified:** Yes\n`;
  }
  
  return text;
};

/**
 * Handle profile edit
 */
export const handleProfileEdit = async (ctx) => {
  try {
    await ctx.answerCbQuery();
    
    await ctx.editMessageText(
      `✏️ **Edit Profile**\n\n` +
      `What would you like to edit?`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🏢 Company', callback_data: 'edit_company' },
              { text: '🏭 Industry', callback_data: 'edit_industry' }
            ],
            [
              { text: '📍 Location', callback_data: 'edit_location' },
              { text: '💼 Experience', callback_data: 'edit_experience' }
            ],
            [
              { text: '💰 Investment Range', callback_data: 'edit_investment' },
              { text: '📝 Bio', callback_data: 'edit_bio' }
            ],
            [
              { text: '🌐 Website', callback_data: 'edit_website' },
              { text: '💼 LinkedIn', callback_data: 'edit_linkedin' }
            ],
            [
              { text: '🔙 Back to Profile', callback_data: 'profile_view' }
            ]
          ]
        }
      }
    );
  } catch (error) {
    logUserAction(ctx.user?.telegramId, 'profile_edit_error', { error: error.message });
    await ctx.answerCbQuery('❌ Error opening profile editor. Please try again.');
  }
};

/**
 * Handle user type change
 */
export const handleUserTypeChange = async (ctx) => {
  try {
    await ctx.answerCbQuery();
    
    await ctx.editMessageText(
      `🔄 **Change User Type**\n\n` +
      `Current type: ${ctx.user.userType}\n\n` +
      `Select your new user type:`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🏢 Investor', callback_data: 'change_type_investor' },
              { text: '🛒 Buyer', callback_data: 'change_type_buyer' }
            ],
            [
              { text: '🔄 Both', callback_data: 'change_type_both' },
              { text: '❌ None', callback_data: 'change_type_none' }
            ],
            [
              { text: '🔙 Back to Profile', callback_data: 'profile_view' }
            ]
          ]
        }
      }
    );
  } catch (error) {
    logUserAction(ctx.user?.telegramId, 'user_type_change_error', { error: error.message });
    await ctx.answerCbQuery('❌ Error changing user type. Please try again.');
  }
};

/**
 * Handle user type change confirmation
 */
export const handleUserTypeChangeConfirm = async (ctx) => {
  try {
    const newType = ctx.callbackQuery.data.split('_')[2];
    const user = ctx.user;
    
    const oldType = user.userType;
    user.userType = newType;
    await user.save();
    
    logUserAction(user.telegramId, 'user_type_changed', { 
      oldType, 
      newType 
    });
    
    await ctx.answerCbQuery(`✅ User type changed to ${newType}!`);
    
    await ctx.editMessageText(
      `✅ **User Type Updated**\n\n` +
      `Your user type has been changed from "${oldType}" to "${newType}".\n\n` +
      `This change will affect the features available to you and how others can find you in searches.`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '👤 View Profile', callback_data: 'profile_view' },
              { text: '🔍 Start Searching', callback_data: 'search_menu' }
            ]
          ]
        }
      }
    );
  } catch (error) {
    logUserAction(ctx.user?.telegramId, 'user_type_change_confirm_error', { error: error.message });
    await ctx.answerCbQuery('❌ Error updating user type. Please try again.');
  }
};

/**
 * Handle profile stats
 */
export const handleProfileStats = async (ctx) => {
  try {
    const user = ctx.user;
    
    await ctx.answerCbQuery();
    
    const stats = {
      accountAge: user.accountAge,
      lastActivity: user.lastActivity,
      profileCompleteness: calculateProfileCompleteness(user),
      verificationStatus: user.verificationStatus?.isVerified ? 'Verified' : 'Not Verified'
    };
    
    const statsText = `📊 **Profile Statistics**\n\n` +
      `📅 **Account Age:** ${stats.accountAge} days\n` +
      `🕒 **Last Activity:** ${stats.lastActivity.toLocaleDateString()}\n` +
      `📝 **Profile Completeness:** ${stats.profileCompleteness}%\n` +
      `🔒 **Verification:** ${stats.verificationStatus}\n` +
      `👥 **User Type:** ${user.userType}\n` +
      `📊 **Subscription:** ${user.subscription?.plan || 'free'}`;
    
    await ctx.editMessageText(statsText, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🔙 Back to Profile', callback_data: 'profile_view' }
          ]
        ]
      }
    });
  } catch (error) {
    logUserAction(ctx.user?.telegramId, 'profile_stats_error', { error: error.message });
    await ctx.answerCbQuery('❌ Error loading profile stats. Please try again.');
  }
};

/**
 * Calculate profile completeness percentage
 */
const calculateProfileCompleteness = (user) => {
  const profile = user.profile || {};
  const fields = [
    'company',
    'industry',
    'location',
    'experience',
    'bio',
    'website',
    'linkedin'
  ];
  
  const filledFields = fields.filter(field => profile[field] && profile[field].trim());
  return Math.round((filledFields.length / fields.length) * 100);
};

/**
 * Handle profile field editing
 */
export const handleProfileFieldEdit = async (ctx, field) => {
  try {
    await ctx.answerCbQuery();
    
    const fieldNames = {
      company: 'Company/Organization name',
      industry: 'Industry',
      location: 'Location',
      experience: 'Experience level',
      investment: 'Investment range',
      bio: 'Bio (max 500 characters)',
      website: 'Website URL',
      linkedin: 'LinkedIn profile URL'
    };
    
    await ctx.editMessageText(
      `✏️ **Edit ${fieldNames[field]}**\n\n` +
      `Current value: ${ctx.user.profile?.[field] || 'Not set'}\n\n` +
      `Please send me the new value, or type "skip" to keep the current value:`
    );
    
    // Set conversation state for field editing
    if (ctx.conversation) {
      ctx.conversation.state = 'profile_field_edit';
      ctx.conversation.data = { editingField: field };
      await ctx.conversation.save();
    }
  } catch (error) {
    logUserAction(ctx.user?.telegramId, 'profile_field_edit_error', { error: error.message });
    await ctx.answerCbQuery('❌ Error starting field edit. Please try again.');
  }
};
