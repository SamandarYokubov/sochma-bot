const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  // Telegram chat information
  chatId: {
    type: Number,
    required: true,
    unique: true
  },
  chatType: {
    type: String,
    enum: ['private', 'group', 'supergroup', 'channel'],
    required: true
  },
  title: {
    type: String,
    default: null
  },
  username: {
    type: String,
    default: null
  },
  description: {
    type: String,
    default: null
  },
  
  // Chat statistics
  messageCount: {
    type: Number,
    default: 0
  },
  userCount: {
    type: Number,
    default: 0
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  firstActivity: {
    type: Date,
    default: Date.now
  },
  
  // Chat settings
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
  collection: 'chats'
});

// Indexes for better performance (chatId already has unique index)
chatSchema.index({ chatType: 1 });
chatSchema.index({ username: 1 });
chatSchema.index({ lastActivity: -1 });
chatSchema.index({ createdAt: -1 });

// Instance methods
chatSchema.methods.updateLastActivity = function() {
  this.lastActivity = new Date();
  return this.save();
};

chatSchema.methods.incrementMessageCount = function() {
  this.messageCount += 1;
  this.lastActivity = new Date();
  return this.save();
};

chatSchema.methods.toSafeObject = function() {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

// Static methods
chatSchema.statics.findByChatId = function(chatId) {
  return this.findOne({ chatId });
};

chatSchema.statics.findByType = function(chatType) {
  return this.find({ chatType, isActive: true });
};

chatSchema.statics.findActiveChats = function() {
  return this.find({ isActive: true, blocked: false });
};

chatSchema.statics.getChatStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$chatType',
        count: { $sum: 1 },
        totalMessages: { $sum: '$messageCount' },
        averageMessages: { $avg: '$messageCount' }
      }
    }
  ]);
};

// Pre-save middleware
chatSchema.pre('save', function(next) {
  if (this.isNew) {
    this.firstActivity = new Date();
  }
  this.lastActivity = new Date();
  next();
});

module.exports = mongoose.model('Chat', chatSchema);
