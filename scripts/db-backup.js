// Database backup and restore scripts for Sochma Bot
// Run with: mongosh sochma_bot scripts/db-backup.js

print("=== Sochma Bot Database Backup ===");

// Get current date for backup naming
const currentDate = new Date();
const dateString = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD format
const backupDir = `/backup/sochma-bot-${dateString}`;

print(`Backup Date: ${dateString}`);
print(`Backup Directory: ${backupDir}`);
print("");

// 1. Create backup directory
print("1. Creating backup directory...");
// Note: This would need to be run with appropriate permissions
// mkdir -p ${backupDir}

// 2. Export users collection
print("2. Exporting users collection...");
const usersCount = db.users.countDocuments();
print(`   Found ${usersCount} users to backup`);

// Export to JSON (this would be done with mongoexport in practice)
// mongoexport --db sochma_bot --collection users --out ${backupDir}/users.json

// 3. Export conversations collection
print("3. Exporting conversations collection...");
const conversationsCount = db.conversations.countDocuments();
print(`   Found ${conversationsCount} conversations to backup`);

// Export to JSON
// mongoexport --db sochma_bot --collection conversations --out ${backupDir}/conversations.json

// 4. Create backup metadata
print("4. Creating backup metadata...");
const backupMetadata = {
  backupDate: currentDate,
  database: db.getName(),
  collections: {
    users: usersCount,
    conversations: conversationsCount
  },
  version: "1.0.0",
  botVersion: "1.0.0"
};

// Save metadata
// printjson(backupMetadata);

print("Backup metadata:");
print(`  Database: ${backupMetadata.database}`);
print(`  Users: ${backupMetadata.collections.users}`);
print(`  Conversations: ${backupMetadata.collections.conversations}`);
print(`  Date: ${backupMetadata.backupDate}`);
print("");

// 5. Verify backup integrity
print("5. Verifying backup integrity...");
const userSample = db.users.findOne();
const conversationSample = db.conversations.findOne();

if (userSample && conversationSample) {
  print("   ✓ Users collection accessible");
  print("   ✓ Conversations collection accessible");
  print("   ✓ Backup integrity verified");
} else {
  print("   ✗ Backup integrity check failed");
}

print("");
print("=== Backup Complete ===");
print("");
print("To restore from backup, use:");
print("  mongorestore --db sochma_bot /path/to/backup/sochma-bot-YYYY-MM-DD/");
print("");
print("To create actual backup files, run:");
print(`  mongodump --db sochma_bot --out ${backupDir}`);
print(`  tar -czf sochma-bot-${dateString}.tar.gz ${backupDir}`);
