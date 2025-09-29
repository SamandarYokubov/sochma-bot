/**
 * Utility helper functions
 */

/**
 * Format a date to a readable string
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
  if (!(date instanceof Date)) {
    return 'Invalid Date';
  }
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Generate a random greeting message
 * @param {string} name - User's name
 * @returns {string} Random greeting
 */
function getRandomGreeting(name = 'friend') {
  const greetings = [
    `Hello ${name}! 👋`,
    `Hi ${name}! How are you? 😊`,
    `Hey ${name}! Nice to see you! 🎉`,
    `Greetings ${name}! Welcome! 🌟`,
    `Good to see you, ${name}! 🤗`
  ];
  
  return greetings[Math.floor(Math.random() * greetings.length)];
}

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
function truncateText(text, maxLength = 100) {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength) + '...';
}

/**
 * Validate Telegram user ID
 * @param {any} userId - User ID to validate
 * @returns {boolean} True if valid
 */
function isValidUserId(userId) {
  return typeof userId === 'number' && userId > 0 && Number.isInteger(userId);
}

/**
 * Sanitize user input
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized input
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
}

/**
 * Calculate time difference in human readable format
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date (defaults to now)
 * @returns {string} Human readable time difference
 */
function getTimeDifference(date1, date2 = new Date()) {
  const diffMs = Math.abs(date2 - date1);
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
}

module.exports = {
  formatDate,
  getRandomGreeting,
  truncateText,
  isValidUserId,
  sanitizeInput,
  getTimeDifference
};
