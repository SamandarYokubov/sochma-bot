# 🐚 MongoDB Shell (mongosh) Guide for Sochma Bot

This guide explains how to use `mongosh` (MongoDB Shell) to manage and monitor your Sochma Bot's database.

## 📋 What is mongosh?

`mongosh` is the modern MongoDB Shell - an interactive JavaScript interface to MongoDB. It replaced the older `mongo` shell and provides:

- **Interactive database queries**
- **Database administration**
- **Data manipulation and analysis**
- **Scripting capabilities**
- **Better performance and modern features**

## 🚀 Getting Started

### Installation

```bash
# Ubuntu/Debian
sudo apt install mongodb-mongosh

# macOS
brew install mongosh

# Windows
# Download from https://www.mongodb.com/try/download/shell
```

### Basic Connection

```bash
# Connect to local MongoDB
mongosh

# Connect to specific database
mongosh mongodb://localhost:27017/sochma_bot

# Connect with authentication
mongosh mongodb://username:password@localhost:27017/sochma_bot
```

## 🔍 Basic Operations

### Database Navigation

```javascript
// Show current database
db

// List all databases
show dbs

// Switch to sochma_bot database
use sochma_bot

// Show collections
show collections

// Show current database stats
db.stats()
```

### User Management Queries

```javascript
// Count total users
db.users.countDocuments()

// Find user by Telegram ID
db.users.findOne({telegramId: 123456789})

// Find all investors
db.users.find({userType: "investor"})

// Find users with complete profiles
db.users.find({
  "profile.company": {$exists: true, $ne: null},
  "profile.industry": {$exists: true, $ne: null},
  "profile.location": {$exists: true, $ne: null}
})

// Find active users
db.users.find({
  status: "active",
  lastActivity: {$gte: new Date(Date.now() - 30*24*60*60*1000)}
})
```

### Conversation Management

```javascript
// Count total conversations
db.conversations.countDocuments()

// Find active conversations
db.conversations.find({isActive: true})

// Find conversations by user
db.conversations.find({telegramId: 123456789})

// Find conversations by type
db.conversations.find({type: "command"})
```

## 📊 Analytics and Statistics

### User Analytics

```javascript
// User type distribution
db.users.aggregate([
  {$group: {_id: "$userType", count: {$sum: 1}}},
  {$sort: {count: -1}}
])

// Users by industry
db.users.aggregate([
  {$match: {"profile.industry": {$exists: true}}},
  {$group: {_id: "$profile.industry", count: {$sum: 1}}},
  {$sort: {count: -1}},
  {$limit: 10}
])

// Users by location
db.users.aggregate([
  {$match: {"profile.location": {$exists: true}}},
  {$group: {_id: "$profile.location", count: {$sum: 1}}},
  {$sort: {count: -1}},
  {$limit: 10}
])

// User growth over time
db.users.aggregate([
  {
    $group: {
      _id: {
        year: {$year: "$joinedAt"},
        month: {$month: "$joinedAt"}
      },
      count: {$sum: 1}
    }
  },
  {$sort: {"_id.year": 1, "_id.month": 1}}
])
```

### Activity Analytics

```javascript
// Most active users
db.users.find().sort({lastActivity: -1}).limit(10)

// Recent registrations
db.users.find().sort({joinedAt: -1}).limit(10)

// Conversation statistics
db.conversations.aggregate([
  {
    $group: {
      _id: "$type",
      count: {$sum: 1},
      avgDuration: {$avg: {$subtract: ["$completedAt", "$startedAt"]}}
    }
  }
])
```

## 🛠️ Database Administration

### Index Management

```javascript
// View existing indexes
db.users.getIndexes()
db.conversations.getIndexes()

// Create custom indexes
db.users.createIndex({telegramId: 1}, {unique: true})
db.users.createIndex({userType: 1, status: 1})
db.users.createIndex({"profile.industry": 1})
db.conversations.createIndex({telegramId: 1, isActive: 1})

// Drop index
db.users.dropIndex("index_name")
```

### Data Cleanup

```javascript
// Remove inactive users (older than 1 year)
db.users.deleteMany({
  lastActivity: {$lt: new Date(Date.now() - 365*24*60*60*1000)},
  status: {$ne: "active"}
})

// Clean up old conversations
db.conversations.deleteMany({
  isActive: false,
  completedAt: {$lt: new Date(Date.now() - 30*24*60*60*1000)}
})

// Update user types
db.users.updateMany(
  {userType: "none"},
  {$set: {userType: "buyer"}}
)
```

### Performance Monitoring

```javascript
// Enable profiling for slow queries
db.setProfilingLevel(2, {slowms: 100})

// View slow queries
db.system.profile.find({millis: {$gt: 100}}).sort({ts: -1})

// Collection statistics
db.runCommand({collStats: "users"})
db.runCommand({collStats: "conversations"})
```

## 📜 Using Scripts

### Run Admin Script

```bash
# Run database administration script
mongosh sochma_bot scripts/db-admin.js
```

This script provides:
- User statistics
- Conversation statistics
- Top industries and locations
- Database size information

### Run Cleanup Script

```bash
# Run database cleanup script
mongosh sochma_bot scripts/db-cleanup.js
```

This script:
- Removes inactive users
- Cleans up old conversations
- Removes invalid data
- Updates missing fields
- Rebuilds indexes

### Run Backup Script

```bash
# Run backup preparation script
mongosh sochma_bot scripts/db-backup.js
```

## 🔧 Advanced Operations

### Custom Queries

```javascript
// Find users with incomplete profiles
db.users.find({
  $or: [
    {"profile.company": {$exists: false}},
    {"profile.industry": {$exists: false}},
    {"profile.location": {$exists: false}}
  ]
})

// Find users who haven't been active recently
db.users.find({
  lastActivity: {$lt: new Date(Date.now() - 7*24*60*60*1000)},
  status: "active"
})

// Complex aggregation for user insights
db.users.aggregate([
  {
    $match: {
      status: "active",
      "profile.industry": {$exists: true}
    }
  },
  {
    $group: {
      _id: "$profile.industry",
      users: {$sum: 1},
      avgAccountAge: {$avg: {$subtract: [new Date(), "$joinedAt"]}},
      verifiedUsers: {$sum: {$cond: ["$verificationStatus.isVerified", 1, 0]}}
    }
  },
  {
    $sort: {users: -1}
  }
])
```

### Data Export

```javascript
// Export users to JSON
// (Use mongoexport command line tool)
// mongoexport --db sochma_bot --collection users --out users.json

// Export specific query results
// mongoexport --db sochma_bot --collection users --query '{"userType":"investor"}' --out investors.json
```

## 🚨 Troubleshooting

### Common Issues

```javascript
// Check database connection
db.adminCommand('ping')

// Check if collections exist
db.getCollectionNames()

// Check collection sizes
db.users.countDocuments()
db.conversations.countDocuments()

// Check for duplicate users
db.users.aggregate([
  {$group: {_id: "$telegramId", count: {$sum: 1}}},
  {$match: {count: {$gt: 1}}}
])
```

### Performance Issues

```javascript
// Check slow operations
db.currentOp({"secs_running": {$gte: 1}})

// Kill long-running operations
db.killOp(operation_id)

// Check database locks
db.currentOp(true)
```

## 📊 Monitoring Commands

### Real-time Monitoring

```bash
# Monitor database operations
mongosh --eval "
db.setProfilingLevel(2, {slowms: 100});
while(true) {
  print('=== ' + new Date() + ' ===');
  db.system.profile.find().sort({ts: -1}).limit(5).forEach(printjson);
  sleep(5000);
}
"
```

### Health Checks

```bash
# Database health check
mongosh --eval "db.adminCommand('ping')"

# Connection count
mongosh --eval "db.serverStatus().connections"

# Memory usage
mongosh --eval "db.serverStatus().mem"
```

## 🔒 Security Best Practices

### Access Control

```javascript
// Create read-only user
db.createUser({
  user: "readonly",
  pwd: "password",
  roles: [{role: "read", db: "sochma_bot"}]
})

// Create admin user
db.createUser({
  user: "admin",
  pwd: "password",
  roles: [{role: "dbOwner", db: "sochma_bot"}]
})
```

### Data Validation

```javascript
// Add validation to collections
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["telegramId", "firstName", "userType"],
      properties: {
        telegramId: {bsonType: "number"},
        firstName: {bsonType: "string"},
        userType: {enum: ["investor", "buyer", "both", "none"]}
      }
    }
  }
})
```

## 📚 Useful Resources

- [MongoDB Shell Documentation](https://docs.mongodb.com/mongodb-shell/)
- [MongoDB Query Operators](https://docs.mongodb.com/manual/reference/operator/query/)
- [MongoDB Aggregation Pipeline](https://docs.mongodb.com/manual/aggregation/)
- [MongoDB Indexes](https://docs.mongodb.com/manual/indexes/)

## 🎯 Quick Reference

### Essential Commands

```bash
# Connect to database
mongosh mongodb://localhost:27017/sochma_bot

# Show collections
show collections

# Count documents
db.users.countDocuments()

# Find documents
db.users.find().limit(10)

# Update documents
db.users.updateMany({}, {$set: {field: "value"}})

# Delete documents
db.users.deleteMany({condition: "value"})

# Create index
db.users.createIndex({field: 1})

# Show indexes
db.users.getIndexes()

# Database stats
db.stats()

# Collection stats
db.runCommand({collStats: "users"})
```

### Script Execution

```bash
# Run JavaScript file
mongosh sochma_bot script.js

# Run with output
mongosh sochma_bot --quiet script.js

# Run single command
mongosh sochma_bot --eval "db.users.countDocuments()"
```

This guide should help you effectively manage and monitor your Sochma Bot's database using mongosh! 🚀
