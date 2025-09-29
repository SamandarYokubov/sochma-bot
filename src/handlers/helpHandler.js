import { logUserAction } from '../utils/logger.js';

/**
 * Handle /help command
 */
export const helpHandler = async (ctx) => {
  try {
    const user = ctx.user;
    
    logUserAction(user.telegramId, 'help_requested');

    await ctx.reply(
      `❓ **Sochma Bot Help**\n\n` +
      `Welcome to Sochma Bot! I'm here to help you connect with investors and buyers.\n\n` +
      `**📋 Available Commands:**\n\n` +
      `• /start - Start the bot and set up your profile\n` +
      `• /profile - View and edit your profile\n` +
      `• /search - Search for investors and buyers\n` +
      `• /help - Show this help message\n` +
      `• /settings - Manage your bot settings\n` +
      `• /stats - View your account statistics\n` +
      `• /contact - Contact support\n\n` +
      `**🔍 How to Search:**\n` +
      `1. Use /search to open the search menu\n` +
      `2. Choose your search criteria (users, industry, location, etc.)\n` +
      `3. Browse through the results\n` +
      `4. Click on profiles to view details\n` +
      `5. Contact users you're interested in\n\n` +
      `**👤 Profile Setup:**\n` +
      `1. Use /profile to view your current profile\n` +
      `2. Click "Edit Profile" to update information\n` +
      `3. Complete all fields for better visibility\n` +
      `4. Set your user type (investor/buyer/both)\n\n` +
      `**💡 Tips:**\n` +
      `• Complete your profile for better search results\n` +
      `• Be specific in your bio and company description\n` +
      `• Keep your profile updated\n` +
      `• Use advanced search for specific criteria\n\n` +
      `Need more help? Contact our support team!`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📝 Profile Guide', callback_data: 'help_profile' },
              { text: '🔍 Search Guide', callback_data: 'help_search' }
            ],
            [
              { text: '💬 Contact Support', callback_data: 'contact_support' },
              { text: '🔙 Back to Menu', callback_data: 'main_menu' }
            ]
          ]
        }
      }
    );
  } catch (error) {
    logUserAction(ctx.user?.telegramId, 'help_error', { error: error.message });
    await ctx.reply('❌ Error loading help. Please try again.');
  }
};

/**
 * Handle profile help
 */
export const handleProfileHelp = async (ctx) => {
  try {
    await ctx.answerCbQuery();
    
    await ctx.editMessageText(
      `📝 **Profile Setup Guide**\n\n` +
      `**Why complete your profile?**\n` +
      `• Better visibility in search results\n` +
      `• More professional appearance\n` +
      `• Higher chance of getting contacted\n` +
      `• Access to premium features\n\n` +
      `**Required Information:**\n` +
      `• Company/Organization name\n` +
      `• Industry\n` +
      `• Location\n` +
      `• User type (investor/buyer/both)\n\n` +
      `**Optional Information:**\n` +
      `• Experience level\n` +
      `• Investment range (for investors)\n` +
      `• Bio (max 500 characters)\n` +
      `• Website URL\n` +
      `• LinkedIn profile\n\n` +
      `**Tips for a great profile:**\n` +
      `• Use clear, professional language\n` +
      `• Be specific about your industry\n` +
      `• Include relevant keywords\n` +
      `• Keep information up to date\n` +
      `• Add a compelling bio\n\n` +
      `**Privacy Settings:**\n` +
      `• Control who can see your contact info\n` +
      `• Set notification preferences\n` +
      `• Manage data sharing options`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✏️ Edit My Profile', callback_data: 'profile_edit' },
              { text: '⚙️ Privacy Settings', callback_data: 'profile_privacy' }
            ],
            [
              { text: '🔙 Back to Help', callback_data: 'help' }
            ]
          ]
        }
      }
    );
  } catch (error) {
    logUserAction(ctx.user?.telegramId, 'profile_help_error', { error: error.message });
    await ctx.answerCbQuery('❌ Error loading profile help. Please try again.');
  }
};

/**
 * Handle search help
 */
export const handleSearchHelp = async (ctx) => {
  try {
    await ctx.answerCbQuery();
    
    await ctx.editMessageText(
      `🔍 **Search Guide**\n\n` +
      `**Search Types:**\n\n` +
      `**👥 User Search:**\n` +
      `• Find investors or buyers\n` +
      `• Filter by user type\n` +
      `• View detailed profiles\n` +
      `• Contact directly\n\n` +
      `**🏭 Industry Search:**\n` +
      `• Find users in specific industries\n` +
      `• See industry statistics\n` +
      `• Filter by company type\n\n` +
      `**📍 Location Search:**\n` +
      `• Find users in your area\n` +
      `• Local networking opportunities\n` +
      `• Regional business connections\n\n` +
      `**💰 Investment Search:**\n` +
      `• Find investors by investment range\n` +
      `• Match with your funding needs\n` +
      `• Filter by investment type\n\n` +
      `**🔍 Advanced Search:**\n` +
      `• Combine multiple criteria\n` +
      `• Custom search parameters\n` +
      `• Save search preferences\n\n` +
      `**Search Tips:**\n` +
      `• Use specific keywords\n` +
      `• Try different search combinations\n` +
      `• Check user activity dates\n` +
      `• Read profiles before contacting\n` +
      `• Be respectful in communications\n\n` +
      `**Contact Etiquette:**\n` +
      `• Introduce yourself clearly\n` +
      `• Explain why you're contacting them\n` +
      `• Be professional and courteous\n` +
      `• Don't spam or send unsolicited messages`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🔍 Start Searching', callback_data: 'search_menu' },
              { text: '💡 Search Tips', callback_data: 'help_search_tips' }
            ],
            [
              { text: '🔙 Back to Help', callback_data: 'help' }
            ]
          ]
        }
      }
    );
  } catch (error) {
    logUserAction(ctx.user?.telegramId, 'search_help_error', { error: error.message });
    await ctx.answerCbQuery('❌ Error loading search help. Please try again.');
  }
};

/**
 * Handle search tips
 */
export const handleSearchTips = async (ctx) => {
  try {
    await ctx.answerCbQuery();
    
    await ctx.editMessageText(
      `💡 **Search Tips & Best Practices**\n\n` +
      `**🔍 Effective Searching:**\n` +
      `• Start with broad searches, then narrow down\n` +
      `• Use multiple search criteria for better results\n` +
      `• Check user activity to find active members\n` +
      `• Look for users with complete profiles\n\n` +
      `**👤 Profile Evaluation:**\n` +
      `• Read the full profile before contacting\n` +
      `• Check company information and website\n` +
      `• Look for mutual connections or interests\n` +
      `• Verify user type matches your needs\n\n` +
      `**💬 Contact Strategy:**\n` +
      `• Personalize your message\n` +
      `• Mention why you're interested in connecting\n` +
      `• Be clear about your goals\n` +
      `• Include relevant information about yourself\n\n` +
      `**🚫 What to Avoid:**\n` +
      `• Generic or copy-paste messages\n` +
      `• Spamming multiple users with the same message\n` +
      `• Asking for money or investments immediately\n` +
      `• Sharing personal information too quickly\n\n` +
      `**✅ Success Factors:**\n` +
      `• Complete your own profile first\n` +
      `• Be patient and persistent\n` +
      `• Follow up appropriately\n` +
      `• Build relationships gradually\n` +
      `• Be professional and respectful\n\n` +
      `**📊 Search Analytics:**\n` +
      `• Track your search history\n` +
      `• Save interesting profiles\n` +
      `• Monitor response rates\n` +
      `• Adjust your approach based on results`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🔍 Try Advanced Search', callback_data: 'search_advanced' },
              { text: '📊 View My Stats', callback_data: 'profile_stats' }
            ],
            [
              { text: '🔙 Back to Search Help', callback_data: 'help_search' }
            ]
          ]
        }
      }
    );
  } catch (error) {
    logUserAction(ctx.user?.telegramId, 'search_tips_error', { error: error.message });
    await ctx.answerCbQuery('❌ Error loading search tips. Please try again.');
  }
};

/**
 * Handle contact support
 */
export const handleContactSupport = async (ctx) => {
  try {
    await ctx.answerCbQuery();
    
    await ctx.editMessageText(
      `💬 **Contact Support**\n\n` +
      `Need help? We're here to assist you!\n\n` +
      `**📧 Email Support:**\n` +
      `support@sochma.com\n\n` +
      `**🕒 Support Hours:**\n` +
      `Monday - Friday: 9:00 AM - 6:00 PM (UTC)\n` +
      `Saturday: 10:00 AM - 4:00 PM (UTC)\n\n` +
      `**📱 Telegram Support:**\n` +
      `@sochma_support\n\n` +
      `**🌐 Website:**\n` +
      `https://sochma.com/support\n\n` +
      `**📋 Common Issues:**\n` +
      `• Profile not updating\n` +
      `• Search not working\n` +
      `• Contact information not showing\n` +
      `• Account verification\n` +
      `• Technical problems\n\n` +
      `**💡 Before Contacting:**\n` +
      `• Check this help section\n` +
      `• Try restarting the bot with /start\n` +
      `• Clear your browser cache if using web version\n` +
      `• Check your internet connection\n\n` +
      `**📝 When Contacting:**\n` +
      `• Describe your issue clearly\n` +
      `• Include your user ID: ${ctx.user.telegramId}\n` +
      `• Mention when the issue occurred\n` +
      `• Include any error messages`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📧 Send Email', url: 'mailto:support@sochma.com' },
              { text: '💬 Telegram Support', url: 'https://t.me/sochma_support' }
            ],
            [
              { text: '🌐 Visit Website', url: 'https://sochma.com/support' }
            ],
            [
              { text: '🔙 Back to Help', callback_data: 'help' }
            ]
          ]
        }
      }
    );
  } catch (error) {
    logUserAction(ctx.user?.telegramId, 'contact_support_error', { error: error.message });
    await ctx.answerCbQuery('❌ Error loading support information. Please try again.');
  }
};
