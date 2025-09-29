import User from '../models/User.js';
import { logUserAction } from '../utils/logger.js';

/**
 * Handle /search command
 */
export const searchHandler = async (ctx) => {
  try {
    const user = ctx.user;
    
    logUserAction(user.telegramId, 'search_menu_opened');

    await ctx.reply(
      `🔍 **Search Menu**\n\n` +
      `What would you like to search for?`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '👥 Find Users', callback_data: 'search_users' },
              { text: '🏢 Find Companies', callback_data: 'search_companies' }
            ],
            [
              { text: '🏭 By Industry', callback_data: 'search_industry' },
              { text: '📍 By Location', callback_data: 'search_location' }
            ],
            [
              { text: '💰 Investment Range', callback_data: 'search_investment' },
              { text: '🔍 Advanced Search', callback_data: 'search_advanced' }
            ],
            [
              { text: '🔙 Back to Menu', callback_data: 'main_menu' }
            ]
          ]
        }
      }
    );
  } catch (error) {
    logUserAction(ctx.user?.telegramId, 'search_menu_error', { error: error.message });
    await ctx.reply('❌ Error opening search menu. Please try again.');
  }
};

/**
 * Handle user search
 */
export const handleUserSearch = async (ctx) => {
  try {
    const user = ctx.user;
    
    await ctx.answerCbQuery();
    
    // Get opposite user types for search
    const searchTypes = getSearchTypes(user.userType);
    
    if (searchTypes.length === 0) {
      await ctx.editMessageText(
        `❌ **No Search Results**\n\n` +
        `You need to set your user type to search for other users.\n` +
        `Use /profile to update your user type.`
      );
      return;
    }
    
    await ctx.editMessageText(
      `👥 **Search Users**\n\n` +
      `What type of users are you looking for?`,
      {
        reply_markup: {
          inline_keyboard: [
            ...searchTypes.map(type => [
              { 
                text: getTypeEmoji(type) + ' ' + type.charAt(0).toUpperCase() + type.slice(1) + 's', 
                callback_data: `search_users_type_${type}` 
              }
            ]),
            [
              { text: '🔙 Back to Search', callback_data: 'search_menu' }
            ]
          ]
        }
      }
    );
  } catch (error) {
    logUserAction(ctx.user?.telegramId, 'user_search_error', { error: error.message });
    await ctx.answerCbQuery('❌ Error opening user search. Please try again.');
  }
};

/**
 * Handle user type search
 */
export const handleUserTypeSearch = async (ctx) => {
  try {
    const userType = ctx.callbackQuery.data.split('_')[3];
    const user = ctx.user;
    
    await ctx.answerCbQuery();
    
    // Search for users of the specified type
    const users = await User.findByUserType(userType)
      .limit(10)
      .sort({ lastActivity: -1 });
    
    if (users.length === 0) {
      await ctx.editMessageText(
        `❌ **No ${userType}s Found**\n\n` +
        `There are currently no ${userType}s registered in the system.\n` +
        `Try again later or search by other criteria.`
      );
      return;
    }
    
    const usersText = formatUsersList(users, userType);
    
    await ctx.editMessageText(usersText, {
      reply_markup: {
        inline_keyboard: [
          ...users.map((u, index) => [
            { 
              text: `👤 ${u.fullName}`, 
              callback_data: `view_user_${u._id}` 
            }
          ]),
          [
            { text: '🔍 Search More', callback_data: 'search_users' },
            { text: '🔙 Back to Search', callback_data: 'search_menu' }
          ]
        ]
      }
    });
    
    logUserAction(user.telegramId, 'user_type_search', { 
      userType, 
      resultsCount: users.length 
    });
  } catch (error) {
    logUserAction(ctx.user?.telegramId, 'user_type_search_error', { error: error.message });
    await ctx.answerCbQuery('❌ Error searching users. Please try again.');
  }
};

/**
 * Handle industry search
 */
export const handleIndustrySearch = async (ctx) => {
  try {
    const user = ctx.user;
    
    await ctx.answerCbQuery();
    
    // Get popular industries from database
    const industries = await User.aggregate([
      { $match: { 'profile.industry': { $exists: true, $ne: null } } },
      { $group: { _id: '$profile.industry', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    if (industries.length === 0) {
      await ctx.editMessageText(
        `❌ **No Industries Found**\n\n` +
        `No users have specified their industry yet.\n` +
        `Try searching by other criteria.`
      );
      return;
    }
    
    await ctx.editMessageText(
      `🏭 **Search by Industry**\n\n` +
      `Select an industry to find users:`,
      {
        reply_markup: {
          inline_keyboard: [
            ...industries.map(industry => [
              { 
                text: `${industry._id} (${industry.count})`, 
                callback_data: `search_industry_${industry._id}` 
              }
            ]),
            [
              { text: '🔙 Back to Search', callback_data: 'search_menu' }
            ]
          ]
        }
      }
    );
  } catch (error) {
    logUserAction(ctx.user?.telegramId, 'industry_search_error', { error: error.message });
    await ctx.answerCbQuery('❌ Error loading industries. Please try again.');
  }
};

/**
 * Handle location search
 */
export const handleLocationSearch = async (ctx) => {
  try {
    const user = ctx.user;
    
    await ctx.answerCbQuery();
    
    // Get popular locations from database
    const locations = await User.aggregate([
      { $match: { 'profile.location': { $exists: true, $ne: null } } },
      { $group: { _id: '$profile.location', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    if (locations.length === 0) {
      await ctx.editMessageText(
        `❌ **No Locations Found**\n\n` +
        `No users have specified their location yet.\n` +
        `Try searching by other criteria.`
      );
      return;
    }
    
    await ctx.editMessageText(
      `📍 **Search by Location**\n\n` +
      `Select a location to find users:`,
      {
        reply_markup: {
          inline_keyboard: [
            ...locations.map(location => [
              { 
                text: `${location._id} (${location.count})`, 
                callback_data: `search_location_${location._id}` 
              }
            ]),
            [
              { text: '🔙 Back to Search', callback_data: 'search_menu' }
            ]
          ]
        }
      }
    );
  } catch (error) {
    logUserAction(ctx.user?.telegramId, 'location_search_error', { error: error.message });
    await ctx.answerCbQuery('❌ Error loading locations. Please try again.');
  }
};

/**
 * Handle advanced search
 */
export const handleAdvancedSearch = async (ctx) => {
  try {
    const user = ctx.user;
    
    await ctx.answerCbQuery();
    
    await ctx.editMessageText(
      `🔍 **Advanced Search**\n\n` +
      `Please provide search criteria in the following format:\n\n` +
      `**Example:**\n` +
      `Type: investor\n` +
      `Industry: technology\n` +
      `Location: San Francisco\n` +
      `Investment: 100k-1M\n\n` +
      `Send your search criteria now:`
    );
    
    // Set conversation state for advanced search
    if (ctx.conversation) {
      ctx.conversation.state = 'advanced_search';
      await ctx.conversation.save();
    }
  } catch (error) {
    logUserAction(ctx.user?.telegramId, 'advanced_search_error', { error: error.message });
    await ctx.answerCbQuery('❌ Error starting advanced search. Please try again.');
  }
};

/**
 * Handle user profile view
 */
export const handleUserProfileView = async (ctx) => {
  try {
    const userId = ctx.callbackQuery.data.split('_')[2];
    const viewer = ctx.user;
    
    await ctx.answerCbQuery();
    
    const user = await User.findById(userId);
    
    if (!user) {
      await ctx.editMessageText('❌ User not found.');
      return;
    }
    
    const profileText = formatUserProfileForView(user);
    
    await ctx.editMessageText(profileText, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '💬 Contact', callback_data: `contact_user_${user._id}` },
            { text: '⭐ Save Contact', callback_data: `save_user_${user._id}` }
          ],
          [
            { text: '🔍 Search More', callback_data: 'search_users' },
            { text: '🔙 Back to Search', callback_data: 'search_menu' }
          ]
        ]
      }
    });
    
    logUserAction(viewer.telegramId, 'user_profile_viewed', { 
      viewedUserId: user.telegramId 
    });
  } catch (error) {
    logUserAction(ctx.user?.telegramId, 'user_profile_view_error', { error: error.message });
    await ctx.answerCbQuery('❌ Error viewing user profile. Please try again.');
  }
};

/**
 * Helper functions
 */
const getSearchTypes = (userType) => {
  const typeMap = {
    'investor': ['buyer'],
    'buyer': ['investor'],
    'both': ['investor', 'buyer'],
    'none': []
  };
  return typeMap[userType] || [];
};

const getTypeEmoji = (type) => {
  const emojiMap = {
    'investor': '🏢',
    'buyer': '🛒',
    'both': '🔄'
  };
  return emojiMap[type] || '👤';
};

const formatUsersList = (users, userType) => {
  let text = `👥 **Found ${users.length} ${userType}s**\n\n`;
  
  users.forEach((user, index) => {
    text += `${index + 1}. **${user.fullName}**\n`;
    if (user.profile?.company) text += `   🏢 ${user.profile.company}\n`;
    if (user.profile?.industry) text += `   🏭 ${user.profile.industry}\n`;
    if (user.profile?.location) text += `   📍 ${user.profile.location}\n`;
    text += `   🕒 Last active: ${user.lastActivity.toLocaleDateString()}\n\n`;
  });
  
  return text;
};

const formatUserProfileForView = (user) => {
  const profile = user.profile || {};
  
  let text = `👤 **${user.fullName}**\n\n`;
  
  if (profile.company) text += `🏢 **Company:** ${profile.company}\n`;
  if (profile.industry) text += `🏭 **Industry:** ${profile.industry}\n`;
  if (profile.location) text += `📍 **Location:** ${profile.location}\n`;
  if (profile.experience) text += `💼 **Experience:** ${profile.experience}\n`;
  if (profile.investmentRange) text += `💰 **Investment Range:** ${profile.investmentRange}\n`;
  if (profile.bio) text += `📝 **Bio:** ${profile.bio}\n`;
  if (profile.website) text += `🌐 **Website:** ${profile.website}\n`;
  if (profile.linkedin) text += `💼 **LinkedIn:** ${profile.linkedin}\n`;
  
  text += `\n🕒 **Last Active:** ${user.lastActivity.toLocaleDateString()}`;
  
  return text;
};
