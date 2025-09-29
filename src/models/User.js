const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Telegram user information
  telegramId: {
    type: Number,
    required: true,
    unique: true
  },
  username: {
    type: String,
    default: null
  },
  firstName: {
    type: String,
    default: null
  },
  lastName: {
    type: String,
    default: null
  },
  languageCode: {
    type: String,
    default: 'en'
  },
  isBot: {
    type: Boolean,
    default: false
  },
  
  // Chat information
  chatId: {
    type: Number,
    default: null
  },
  chatType: {
    type: String,
    enum: ['private', 'group', 'supergroup', 'channel'],
    default: 'private'
  },
  
  // User statistics
  messageCount: {
    type: Number,
    default: 0
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  firstSeen: {
    type: Date,
    default: Date.now
  },
  
  // Registration information
  phoneNumber: {
    type: String,
    default: null,
    index: true
  },
  userFullName: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['buyer', 'investor', 'both'],
    default: null
  },
  registrationState: {
    type: String,
    enum: ['not_started', 'phone_entered', 'name_entered', 'role_selected', 'agenda_viewed', 'completed'],
    default: 'not_started'
  },
  isRegistered: {
    type: Boolean,
    default: false
  },
  
  // User preferences
  isActive: {
    type: Boolean,
    default: true
  },
  blocked: {
    type: Boolean,
    default: false
  },
  
  // Additional metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
  collection: 'users'
});

// Indexes for better performance (telegramId already has unique index)
userSchema.index({ username: 1 });
userSchema.index({ chatId: 1 });
userSchema.index({ lastSeen: -1 });
userSchema.index({ createdAt: -1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }
  return this.firstName || this.username || 'Unknown';
});

// Instance methods
userSchema.methods.updateLastSeen = function() {
  this.lastSeen = new Date();
  return this.save();
};

userSchema.methods.incrementMessageCount = function() {
  this.messageCount += 1;
  this.lastSeen = new Date();
  return this.save();
};

userSchema.methods.updateRegistrationState = function(state) {
  this.registrationState = state;
  if (state === 'completed') {
    this.isRegistered = true;
  }
  return this.save();
};

userSchema.methods.setPhoneNumber = function(phoneNumber) {
  this.phoneNumber = phoneNumber;
  this.registrationState = 'phone_entered';
  return this.save();
};

userSchema.methods.setFullName = function(fullName) {
  this.userFullName = fullName;
  this.registrationState = 'name_entered';
  return this.save();
};

userSchema.methods.setRole = function(role) {
  this.role = role;
  this.registrationState = 'role_selected';
  return this.save();
};

userSchema.methods.completeRegistration = function() {
  this.registrationState = 'completed';
  this.isRegistered = true;
  return this.save();
};

userSchema.methods.toSafeObject = function() {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

// Static methods
userSchema.statics.findByTelegramId = function(telegramId) {
  return this.findOne({ telegramId });
};

userSchema.statics.findByUsername = function(username) {
  return this.findOne({ username });
};

userSchema.statics.findActiveUsers = function() {
  return this.find({ isActive: true, blocked: false });
};

userSchema.statics.getUserStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        activeUsers: {
          $sum: {
            $cond: [{ $and: [{ $eq: ['$isActive', true] }, { $eq: ['$blocked', false] }] }, 1, 0]
          }
        },
        totalMessages: { $sum: '$messageCount' },
        averageMessages: { $avg: '$messageCount' }
      }
    }
  ]);
};

// Pre-save middleware
userSchema.pre('save', function(next) {
  if (this.isNew) {
    this.firstSeen = new Date();
  }
  this.lastSeen = new Date();
  next();
});

module.exports = mongoose.model('User', userSchema);
