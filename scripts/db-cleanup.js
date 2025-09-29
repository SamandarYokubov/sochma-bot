// Database cleanup scripts for Sochma Bot
// Run with: mongosh sochma_bot scripts/db-cleanup.js

print("=== Sochma Bot Database Cleanup ===");

// 1. Remove inactive users (older than 1 year)
print("1. Cleaning up inactive users...");
const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
const inactiveUsers = db.users.countDocuments({
  lastActivity: { $lt: oneYearAgo },
  status: { $ne: "active" }
});

if (inactiveUsers > 0) {
  const result = db.users.deleteMany({
    lastActivity: { $lt: oneYearAgo },
    status: { $ne: "active" }
  });
  print(`   Removed ${result.deletedCount} inactive users`);
} else {
  print("   No inactive users to remove");
}

// 2. Clean up old completed conversations (older than 30 days)
print("2. Cleaning up old conversations...");
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
const oldConversations = db.conversations.countDocuments({
  isActive: false,
  completedAt: { $lt: thirtyDaysAgo }
});

if (oldConversations > 0) {
  const result = db.conversations.deleteMany({
    isActive: false,
    completedAt: { $lt: thirtyDaysAgo }
  });
  print(`   Removed ${result.deletedCount} old conversations`);
} else {
  print("   No old conversations to remove");
}

// 3. Remove users with invalid Telegram IDs
print("3. Cleaning up users with invalid data...");
const invalidUsers = db.users.countDocuments({
  $or: [
    { telegramId: { $exists: false } },
    { telegramId: null },
    { telegramId: { $type: "string" } },
    { firstName: { $exists: false } },
    { firstName: null }
  ]
});

if (invalidUsers > 0) {
  const result = db.users.deleteMany({
    $or: [
      { telegramId: { $exists: false } },
      { telegramId: null },
      { telegramId: { $type: "string" } },
      { firstName: { $exists: false } },
      { firstName: null }
    ]
  });
  print(`   Removed ${result.deletedCount} users with invalid data`);
} else {
  print("   No users with invalid data found");
}

// 4. Update users with missing userType
print("4. Updating users with missing userType...");
const usersWithoutType = db.users.countDocuments({
  userType: { $in: [null, "none", ""] }
});

if (usersWithoutType > 0) {
  const result = db.users.updateMany(
    { userType: { $in: [null, "none", ""] } },
    { $set: { userType: "buyer" } }
  );
  print(`   Updated ${result.modifiedCount} users with default userType`);
} else {
  print("   All users have valid userType");
}

// 5. Clean up empty profile fields
print("5. Cleaning up empty profile fields...");
const result = db.users.updateMany(
  {},
  {
    $unset: {
      "profile.company": "",
      "profile.industry": "",
      "profile.location": "",
      "profile.bio": "",
      "profile.website": "",
      "profile.linkedin": ""
    }
  }
);
print(`   Cleaned up empty profile fields for ${result.modifiedCount} users`);

// 6. Rebuild indexes for better performance
print("6. Rebuilding indexes...");
try {
  db.users.reIndex();
  db.conversations.reIndex();
  print("   Indexes rebuilt successfully");
} catch (error) {
  print("   Error rebuilding indexes: " + error.message);
}

// 7. Compact collections to reclaim space
print("7. Compacting collections...");
try {
  db.runCommand({ compact: "users" });
  db.runCommand({ compact: "conversations" });
  print("   Collections compacted successfully");
} catch (error) {
  print("   Error compacting collections: " + error.message);
}

print("");
print("=== Cleanup Complete ===");

// Show final statistics
print("Final Statistics:");
print("Users: " + db.users.countDocuments());
print("Active Users: " + db.users.countDocuments({ status: "active" }));
print("Conversations: " + db.conversations.countDocuments());
print("Active Conversations: " + db.conversations.countDocuments({ isActive: true }));

const stats = db.stats();
print("Database Size: " + (stats.dataSize / 1024 / 1024).toFixed(2) + " MB");
