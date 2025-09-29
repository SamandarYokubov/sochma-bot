// MongoDB initialization script
// This script runs when the MongoDB container starts for the first time

// Switch to the telegram_bot database
db = db.getSiblingDB('telegram_bot');

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['telegramId'],
      properties: {
        telegramId: {
          bsonType: 'number',
          description: 'Telegram user ID must be a number and is required'
        },
        username: {
          bsonType: 'string',
          description: 'Username must be a string'
        },
        firstName: {
          bsonType: 'string',
          description: 'First name must be a string'
        },
        lastName: {
          bsonType: 'string',
          description: 'Last name must be a string'
        },
        languageCode: {
          bsonType: 'string',
          description: 'Language code must be a string'
        },
        isBot: {
          bsonType: 'bool',
          description: 'isBot must be a boolean'
        },
        chatId: {
          bsonType: 'number',
          description: 'Chat ID must be a number'
        },
        chatType: {
          bsonType: 'string',
          enum: ['private', 'group', 'supergroup', 'channel'],
          description: 'Chat type must be one of the specified values'
        },
        messageCount: {
          bsonType: 'number',
          minimum: 0,
          description: 'Message count must be a non-negative number'
        },
        isActive: {
          bsonType: 'bool',
          description: 'isActive must be a boolean'
        },
        blocked: {
          bsonType: 'bool',
          description: 'blocked must be a boolean'
        }
      }
    }
  }
});

db.createCollection('chats', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['chatId', 'chatType'],
      properties: {
        chatId: {
          bsonType: 'number',
          description: 'Chat ID must be a number and is required'
        },
        chatType: {
          bsonType: 'string',
          enum: ['private', 'group', 'supergroup', 'channel'],
          description: 'Chat type must be one of the specified values and is required'
        },
        title: {
          bsonType: 'string',
          description: 'Title must be a string'
        },
        username: {
          bsonType: 'string',
          description: 'Username must be a string'
        },
        description: {
          bsonType: 'string',
          description: 'Description must be a string'
        },
        messageCount: {
          bsonType: 'number',
          minimum: 0,
          description: 'Message count must be a non-negative number'
        },
        userCount: {
          bsonType: 'number',
          minimum: 0,
          description: 'User count must be a non-negative number'
        },
        isActive: {
          bsonType: 'bool',
          description: 'isActive must be a boolean'
        },
        blocked: {
          bsonType: 'bool',
          description: 'blocked must be a boolean'
        }
      }
    }
  }
});

// Create indexes for better performance
// Note: Unique indexes are automatically created by Mongoose schemas
db.users.createIndex({ username: 1 });
db.users.createIndex({ chatId: 1 });
db.users.createIndex({ lastSeen: -1 });
db.users.createIndex({ createdAt: -1 });
db.users.createIndex({ isActive: 1, blocked: 1 });

db.chats.createIndex({ chatType: 1 });
db.chats.createIndex({ username: 1 });
db.chats.createIndex({ lastActivity: -1 });
db.chats.createIndex({ createdAt: -1 });
db.chats.createIndex({ isActive: 1, blocked: 1 });

// Insert initial data or configuration if needed
print('MongoDB initialization completed successfully');
print('Collections created: users, chats');
print('Indexes created for optimal performance');
