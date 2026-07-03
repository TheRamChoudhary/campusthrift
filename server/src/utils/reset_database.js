require('dotenv').config();
const mongoose = require('mongoose');

// Import all models
const AuditLog = require('../models/AuditLog');
const Conversation = require('../models/Conversation');
const Feedback = require('../models/Feedback');
const Listing = require('../models/Listing');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const OTP = require('../models/OTP');
const Request = require('../models/Request');
const Review = require('../models/Review');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

const ADMIN_EMAIL = '205124076@nitt.edu';

async function resetDatabase() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/campusthrift-db';
    console.log(`Connecting to MongoDB at: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully.\n');

    console.log('🧹 Purging all transaction, chat, listing, and audit logs collections...');
    await AuditLog.deleteMany({});
    await Conversation.deleteMany({});
    await Feedback.deleteMany({});
    await Listing.deleteMany({});
    await Message.deleteMany({});
    await Notification.deleteMany({});
    await OTP.deleteMany({});
    await Request.deleteMany({});
    await Review.deleteMany({});
    await Transaction.deleteMany({});
    console.log('✅ Collections successfully cleared.');

    // Find if the admin user exists
    const adminUser = await User.findOne({ email: ADMIN_EMAIL });

    if (adminUser) {
      console.log(`\n👤 Admin user found. Updating roles and permissions...`);
      
      // Update existing admin user properties
      adminUser.role = 'admin';
      adminUser.isVerified = true;
      adminUser.isBlocked = false;
      adminUser.walletBalance = 100000; // Reset wallet balance to high value for admin testing
      adminUser.trustScore = 100;
      adminUser.activeListings = [];
      adminUser.wishlist = [];
      adminUser.blockedUsers = [];
      
      await adminUser.save();
      console.log(`✅ Admin user ${ADMIN_EMAIL} updated and verified successfully.`);
    } else {
      console.log(`\n⚠️ Admin user ${ADMIN_EMAIL} not found. Creating a new admin account...`);
      
      // Create new admin user
      const newAdmin = await User.create({
        name: 'Admin User',
        email: ADMIN_EMAIL,
        password: 'Admin@Password123', // Default admin password
        role: 'admin',
        isVerified: true,
        walletBalance: 100000,
        trustScore: 100
      });
      
      console.log(`✅ New Admin User Created:`);
      console.log(`   - Email: ${ADMIN_EMAIL}`);
      console.log(`   - Password: Admin@Password123 (Please change this after logging in)`);
    }

    // Delete all other users
    console.log(`\n🧹 Removing all other user accounts from the database...`);
    const deleteResult = await User.deleteMany({ email: { $ne: ADMIN_EMAIL } });
    console.log(`✅ Deleted ${deleteResult.deletedCount} non-admin user accounts.`);

  } catch (err) {
    console.error('❌ Error resetting database:', err);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB.');
  }
}

resetDatabase();
