// MongoDB administration scripts for Sochma Bot
// Run with: mongosh sochma_bot scripts/db-admin.js

// Database statistics
print("=== Sochma Bot Database Statistics ===");
print("Database: " + db.getName());
print("Collections: " + db.getCollectionNames().join(", "));
print("");

// User statistics
print("=== User Statistics ===");
const userStats = db.users.aggregate([
  {
    $group: {
      _id: null,
      totalUsers: { $sum: 1 },
      activeUsers: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
      investors: { $sum: { $cond: [{ $eq: ["$userType", "investor"] }, 1, 0] } },
      buyers: { $sum: { $cond: [{ $eq: ["$userType", "buyer"] }, 1, 0] } },
      both: { $sum: { $cond: [{ $eq: ["$userType", "both"] }, 1, 0] } },
      verified: { $sum: { $cond: ["$verificationStatus.isVerified", 1, 0] } }
    }
  }
]).toArray()[0];

if (userStats) {
  print("Total Users: " + userStats.totalUsers);
  print("Active Users: " + userStats.activeUsers);
  print("Investors: " + userStats.investors);
  print("Buyers: " + userStats.buyers);
  print("Both: " + userStats.both);
  print("Verified: " + userStats.verified);
}
print("");

// Recent users
print("=== Recent Users (Last 10) ===");
db.users.find().sort({joinedAt: -1}).limit(10).forEach(user => {
  print(`${user.firstName} ${user.lastName || ''} (${user.userType}) - ${user.joinedAt.toISOString()}`);
});
print("");

// Conversation statistics
print("=== Conversation Statistics ===");
const convStats = db.conversations.aggregate([
  {
    $group: {
      _id: null,
      totalConversations: { $sum: 1 },
      activeConversations: { $sum: { $cond: ["$isActive", 1, 0] } },
      avgDuration: { $avg: { $subtract: ["$completedAt", "$startedAt"] } }
    }
  }
]).toArray()[0];

if (convStats) {
  print("Total Conversations: " + convStats.totalConversations);
  print("Active Conversations: " + convStats.activeConversations);
  if (convStats.avgDuration) {
    print("Average Duration: " + Math.round(convStats.avgDuration / 1000) + " seconds");
  }
}
print("");

// Top industries
print("=== Top Industries ===");
db.users.aggregate([
  { $match: { "profile.industry": { $exists: true, $ne: null } } },
  { $group: { _id: "$profile.industry", count: { $sum: 1 } } },
  { $sort: { count: -1 } },
  { $limit: 10 }
]).forEach(industry => {
  print(`${industry._id}: ${industry.count} users`);
});
print("");

// Top locations
print("=== Top Locations ===");
db.users.aggregate([
  { $match: { "profile.location": { $exists: true, $ne: null } } },
  { $group: { _id: "$profile.location", count: { $sum: 1 } } },
  { $sort: { count: -1 } },
  { $limit: 10 }
]).forEach(location => {
  print(`${location._id}: ${location.count} users`);
});
print("");

// Database size
print("=== Database Size ===");
const stats = db.stats();
print("Database Size: " + (stats.dataSize / 1024 / 1024).toFixed(2) + " MB");
print("Storage Size: " + (stats.storageSize / 1024 / 1024).toFixed(2) + " MB");
print("Index Size: " + (stats.indexSize / 1024 / 1024).toFixed(2) + " MB");
print("");

print("=== Analysis Complete ===");
