import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  telegramId: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  username: {
    type: String,
    trim: true,
    index: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  languageCode: {
    type: String,
    default: 'en'
  },
  isBot: {
    type: Boolean,
    default: false
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  userType: {
    type: String,
    enum: ['investor', 'buyer', 'both', 'none'],
    default: 'none'
  },
  profile: {
    company: String,
    industry: String,
    experience: String,
    investmentRange: String,
    location: String,
    bio: String,
    website: String,
    linkedin: String
  },
  preferences: {
    notifications: {
      type: Boolean,
      default: true
    },
    language: {
      type: String,
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'banned', 'pending_verification'],
    default: 'active'
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  verificationStatus: {
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedAt: Date,
    verificationMethod: String
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'premium', 'enterprise'],
      default: 'free'
    },
    expiresAt: Date,
    features: [String]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
userSchema.index({ telegramId: 1 });
userSchema.index({ username: 1 });
userSchema.index({ userType: 1 });
userSchema.index({ status: 1 });
userSchema.index({ lastActivity: -1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName || ''}`.trim();
});

// Virtual for account age
userSchema.virtual('accountAge').get(function() {
  return Math.floor((Date.now() - this.joinedAt) / (1000 * 60 * 60 * 24));
});

// Instance methods
userSchema.methods.updateLastActivity = function() {
  this.lastActivity = new Date();
  return this.save();
};

userSchema.methods.isActive = function() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return this.lastActivity > thirtyDaysAgo && this.status === 'active';
};

userSchema.methods.canAccessFeature = function(feature) {
  const featureAccess = {
    free: ['basic_search', 'profile_view'],
    basic: ['basic_search', 'profile_view', 'contact_info', 'advanced_search'],
    premium: ['basic_search', 'profile_view', 'contact_info', 'advanced_search', 'priority_support', 'analytics'],
    enterprise: ['all']
  };
  
  return featureAccess[this.subscription.plan]?.includes(feature) || 
         featureAccess[this.subscription.plan]?.includes('all');
};

// Static methods
userSchema.statics.findByTelegramId = function(telegramId) {
  return this.findOne({ telegramId });
};

userSchema.statics.findActiveUsers = function() {
  return this.find({ status: 'active' });
};

userSchema.statics.findByUserType = function(userType) {
  return this.find({ userType, status: 'active' });
};

// Pre-save middleware
userSchema.pre('save', function(next) {
  if (this.isModified('lastActivity')) {
    this.lastActivity = new Date();
  }
  next();
});

const User = mongoose.model('User', userSchema);

export default User;
