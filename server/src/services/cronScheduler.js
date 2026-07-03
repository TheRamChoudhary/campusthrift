const cron = require("node-cron");
const Message = require("../models/Message");
const AuditLog = require("../models/AuditLog");

const initCronScheduler = () => {
  // Schedule a nightly routine to run at exactly 00:00 (Midnight) every day
  cron.schedule("0 0 * * *", async () => {
    console.log("🔄 Running scheduled nightly chat retention cleanup...");
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // Delete messages older than 7 days
      const result = await Message.deleteMany({
        createdAt: { $lt: sevenDaysAgo },
      });

      console.log(
        `🧹 Chat retention cleanup completed. Deleted ${result.deletedCount} messages.`,
      );

      if (result.deletedCount > 0) {
        // Record cleanup action in system Audit Logs
        await AuditLog.create({
          action: "SYSTEM_CHAT_RETENTION_CLEANUP",
          ipAddress: "cron-worker",
          details: `System automatically purged ${result.deletedCount} chat message(s) older than 7 days in accordance with NIT Trichy student privacy policies.`,
        });
      }
    } catch (error) {
      console.error("❌ Nightly chat retention cron failed:", error.message);
    }
  });

  console.log(
    "⏰ Scheduled Chat Retention Cron Job: Nightly at Midnight (00:00) active.",
  );
};

module.exports = initCronScheduler;
