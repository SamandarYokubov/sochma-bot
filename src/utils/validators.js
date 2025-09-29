import Joi from 'joi';

/**
 * Validation schemas for different data types
 */

// User profile validation
export const userProfileSchema = Joi.object({
  company: Joi.string().trim().max(100).optional(),
  industry: Joi.string().trim().max(50).optional(),
  location: Joi.string().trim().max(100).optional(),
  experience: Joi.string().trim().max(50).optional(),
  investmentRange: Joi.string().trim().max(50).optional(),
  bio: Joi.string().trim().max(500).optional(),
  website: Joi.string().uri().optional(),
  linkedin: Joi.string().uri().optional()
});

// User preferences validation
export const userPreferencesSchema = Joi.object({
  notifications: Joi.boolean().default(true),
  language: Joi.string().valid('en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko').default('en'),
  timezone: Joi.string().default('UTC')
});

// User type validation
export const userTypeSchema = Joi.string().valid('investor', 'buyer', 'both', 'none').required();

// Search criteria validation
export const searchCriteriaSchema = Joi.object({
  userType: Joi.string().valid('investor', 'buyer', 'both').optional(),
  industry: Joi.string().trim().max(50).optional(),
  location: Joi.string().trim().max(100).optional(),
  investmentRange: Joi.string().trim().max(50).optional(),
  company: Joi.string().trim().max(100).optional(),
  experience: Joi.string().trim().max(50).optional(),
  limit: Joi.number().integer().min(1).max(50).default(10),
  offset: Joi.number().integer().min(0).default(0)
});

// Contact request validation
export const contactRequestSchema = Joi.object({
  toUserId: Joi.string().required(),
  message: Joi.string().trim().max(500).required(),
  type: Joi.string().valid('connection', 'inquiry', 'collaboration').default('connection')
});

// Notification validation
export const notificationSchema = Joi.object({
  type: Joi.string().valid('info', 'warning', 'success', 'error').required(),
  title: Joi.string().trim().max(100).required(),
  message: Joi.string().trim().max(500).required(),
  data: Joi.object().optional()
});

/**
 * Validation functions
 */

export const validateUserProfile = (profile) => {
  const { error, value } = userProfileSchema.validate(profile);
  if (error) {
    throw new Error(`Profile validation error: ${error.details[0].message}`);
  }
  return value;
};

export const validateUserPreferences = (preferences) => {
  const { error, value } = userPreferencesSchema.validate(preferences);
  if (error) {
    throw new Error(`Preferences validation error: ${error.details[0].message}`);
  }
  return value;
};

export const validateUserType = (userType) => {
  const { error, value } = userTypeSchema.validate(userType);
  if (error) {
    throw new Error(`User type validation error: ${error.details[0].message}`);
  }
  return value;
};

export const validateSearchCriteria = (criteria) => {
  const { error, value } = searchCriteriaSchema.validate(criteria);
  if (error) {
    throw new Error(`Search criteria validation error: ${error.details[0].message}`);
  }
  return value;
};

export const validateContactRequest = (request) => {
  const { error, value } = contactRequestSchema.validate(request);
  if (error) {
    throw new Error(`Contact request validation error: ${error.details[0].message}`);
  }
  return value;
};

export const validateNotification = (notification) => {
  const { error, value } = notificationSchema.validate(notification);
  if (error) {
    throw new Error(`Notification validation error: ${error.details[0].message}`);
  }
  return value;
};

/**
 * Utility validation functions
 */

export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const isValidPhoneNumber = (phone) => {
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

export const isValidLinkedInUrl = (url) => {
  const linkedinRegex = /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9\-]+\/?$/;
  return linkedinRegex.test(url);
};

export const isValidWebsiteUrl = (url) => {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
};

export const sanitizeText = (text, maxLength = 1000) => {
  if (!text) return '';
  
  return text
    .trim()
    .substring(0, maxLength)
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/\s+/g, ' '); // Normalize whitespace
};

export const sanitizeHtml = (html) => {
  if (!html) return '';
  
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .trim();
};

/**
 * Rate limiting validation
 */
export const validateRateLimit = (requests, maxRequests, windowMs) => {
  const now = Date.now();
  const validRequests = requests.filter(time => now - time < windowMs);
  
  return {
    isValid: validRequests.length < maxRequests,
    remainingRequests: Math.max(0, maxRequests - validRequests.length),
    resetTime: validRequests.length > 0 ? validRequests[0] + windowMs : now + windowMs
  };
};

/**
 * Input sanitization for user inputs
 */
export const sanitizeUserInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:/gi, '') // Remove data: protocol
    .replace(/vbscript:/gi, '') // Remove vbscript: protocol
    .substring(0, 1000); // Limit length
};

/**
 * Validate and sanitize search query
 */
export const validateSearchQuery = (query) => {
  if (!query || typeof query !== 'string') {
    throw new Error('Search query must be a non-empty string');
  }
  
  const sanitized = sanitizeUserInput(query);
  
  if (sanitized.length < 2) {
    throw new Error('Search query must be at least 2 characters long');
  }
  
  if (sanitized.length > 100) {
    throw new Error('Search query must be less than 100 characters');
  }
  
  return sanitized;
};

/**
 * Validate pagination parameters
 */
export const validatePagination = (page, limit) => {
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;
  
  if (pageNum < 1) {
    throw new Error('Page number must be greater than 0');
  }
  
  if (limitNum < 1 || limitNum > 100) {
    throw new Error('Limit must be between 1 and 100');
  }
  
  return {
    page: pageNum,
    limit: limitNum,
    offset: (pageNum - 1) * limitNum
  };
};
