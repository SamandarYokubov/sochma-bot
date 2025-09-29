import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  telegramId: {
    type: Number,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['command', 'callback', 'message', 'inline_query'],
    required: true
  },
  command: {
    type: String,
    index: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  context: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  state: {
    type: String,
    default: 'idle'
  },
  step: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  lastInteraction: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  errorCount: {
    type: Number,
    default: 0
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
conversationSchema.index({ userId: 1, isActive: 1 });
conversationSchema.index({ telegramId: 1, isActive: 1 });
conversationSchema.index({ type: 1, command: 1 });
conversationSchema.index({ lastInteraction: -1 });

// Virtual for duration
conversationSchema.virtual('duration').get(function() {
  const endTime = this.completedAt || new Date();
  return Math.floor((endTime - this.startedAt) / 1000);
});

// Instance methods
conversationSchema.methods.updateInteraction = function() {
  this.lastInteraction = new Date();
  return this.save();
};

conversationSchema.methods.incrementError = function() {
  this.errorCount += 1;
  return this.save();
};

conversationSchema.methods.complete = function() {
  this.isActive = false;
  this.completedAt = new Date();
  return this.save();
};

conversationSchema.methods.updateContext = function(newContext) {
  this.context = { ...this.context, ...newContext };
  return this.save();
};

conversationSchema.methods.updateData = function(newData) {
  this.data = { ...this.data, ...newData };
  return this.save();
};

// Static methods
conversationSchema.statics.findActiveByTelegramId = function(telegramId) {
  return this.findOne({ telegramId, isActive: true });
};

conversationSchema.statics.findActiveByUserId = function(userId) {
  return this.findOne({ userId, isActive: true });
};

conversationSchema.statics.createConversation = function(userId, telegramId, type, command, data = {}) {
  return this.create({
    userId,
    telegramId,
    type,
    command,
    data,
    isActive: true
  });
};

conversationSchema.statics.getUserConversationHistory = function(telegramId, limit = 10) {
  return this.find({ telegramId })
    .sort({ lastInteraction: -1 })
    .limit(limit)
    .populate('userId', 'firstName lastName username');
};

// Pre-save middleware
conversationSchema.pre('save', function(next) {
  if (this.isModified('lastInteraction')) {
    this.lastInteraction = new Date();
  }
  next();
});

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;
