/**
 * Utility helper functions for the Sochma Bot
 */

/**
 * Format user profile for display
 */
export const formatUserProfile = (user) => {
  const profile = user.profile || {};
  
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
  const subscription = user.subscription || {};
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
 * Calculate profile completeness percentage
 */
export const calculateProfileCompleteness = (user) => {
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
 * Format date for display
 */
export const formatDate = (date, options = {}) => {
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  
  return new Date(date).toLocaleDateString('en-US', { ...defaultOptions, ...options });
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date) => {
  const now = new Date();
  const diff = now - new Date(date);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
  return `${years} year${years > 1 ? 's' : ''} ago`;
};

/**
 * Truncate text to specified length
 */
export const truncateText = (text, maxLength = 100, suffix = '...') => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
};

/**
 * Escape Markdown special characters
 */
export const escapeMarkdown = (text) => {
  return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
};

/**
 * Format number with commas
 */
export const formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * Format currency
 */
export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

/**
 * Generate random string
 */
export const generateRandomString = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Generate unique ID
 */
export const generateUniqueId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Deep clone object
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
};

/**
 * Check if object is empty
 */
export const isEmpty = (obj) => {
  if (obj == null) return true;
  if (Array.isArray(obj) || typeof obj === 'string') return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  return false;
};

/**
 * Sleep function for delays
 */
export const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retry function with exponential backoff
 */
export const retry = async (fn, maxAttempts = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      await sleep(delay * Math.pow(2, attempt - 1));
    }
  }
};

/**
 * Debounce function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Parse callback data
 */
export const parseCallbackData = (data) => {
  const parts = data.split('_');
  return {
    action: parts[0],
    type: parts[1],
    value: parts[2],
    full: data
  };
};

/**
 * Build callback data
 */
export const buildCallbackData = (action, type, value) => {
  return `${action}_${type}_${value}`;
};

/**
 * Format user list for display
 */
export const formatUserList = (users, title = 'Users') => {
  if (users.length === 0) {
    return `❌ **No ${title} Found**\n\nNo users match your search criteria.`;
  }

  let text = `👥 **Found ${users.length} ${title}**\n\n`;
  
  users.forEach((user, index) => {
    text += `${index + 1}. **${user.fullName}**\n`;
    if (user.profile?.company) text += `   🏢 ${user.profile.company}\n`;
    if (user.profile?.industry) text += `   🏭 ${user.profile.industry}\n`;
    if (user.profile?.location) text += `   📍 ${user.profile.location}\n`;
    text += `   🕒 Last active: ${formatRelativeTime(user.lastActivity)}\n\n`;
  });
  
  return text;
};

/**
 * Get user type emoji
 */
export const getUserTypeEmoji = (userType) => {
  const emojiMap = {
    'investor': '🏢',
    'buyer': '🛒',
    'both': '🔄',
    'none': '👤'
  };
  return emojiMap[userType] || '👤';
};

/**
 * Get industry emoji
 */
export const getIndustryEmoji = (industry) => {
  const emojiMap = {
    'technology': '💻',
    'finance': '💰',
    'healthcare': '🏥',
    'education': '🎓',
    'retail': '🛍️',
    'manufacturing': '🏭',
    'real estate': '🏠',
    'energy': '⚡',
    'transportation': '🚚',
    'media': '📺',
    'food': '🍕',
    'fashion': '👗'
  };
  return emojiMap[industry?.toLowerCase()] || '🏢';
};

/**
 * Validate and format phone number
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return null;
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Add country code if missing
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  
  if (digits.length > 11) {
    return `+${digits}`;
  }
  
  return phone; // Return original if can't format
};

/**
 * Check if user is active (logged in within last 30 days)
 */
export const isUserActive = (user) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return user.lastActivity > thirtyDaysAgo && user.status === 'active';
};

/**
 * Get user activity status
 */
export const getUserActivityStatus = (user) => {
  const now = new Date();
  const lastActivity = new Date(user.lastActivity);
  const diffHours = (now - lastActivity) / (1000 * 60 * 60);
  
  if (diffHours < 1) return '🟢 Online';
  if (diffHours < 24) return '🟡 Active today';
  if (diffHours < 168) return '🟠 Active this week';
  if (diffHours < 720) return '🔴 Active this month';
  return '⚫ Inactive';
};

/**
 * Format file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Check if string is valid JSON
 */
export const isValidJSON = (str) => {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
};

/**
 * Safe JSON parse
 */
export const safeJSONParse = (str, defaultValue = null) => {
  try {
    return JSON.parse(str);
  } catch {
    return defaultValue;
  }
};
