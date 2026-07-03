require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function checkAndFixUsers() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/campusthrift-db';
    console.log(`Connecting to MongoDB at: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully.\n');

    // 1. Fetch all users
    const users = await User.find({}, 'name email role isVerified createdAt');
    console.log('--- Current Users in Database ---');
    users.forEach((u, i) => {
      console.log(`[${i+1}] ID: ${u._id} | Name: ${u.name} | Email: ${u.email} | Role: ${u.role} | Verified: ${u.isVerified} | Created: ${u.createdAt}`);
    });
    console.log('--------------------------------\n');

    // 2. Identify duplicates
    const emailCounts = {};
    users.forEach(u => {
      const email = u.email.toLowerCase();
      emailCounts[email] = emailCounts[email] || [];
      emailCounts[email].push(u);
    });

    let duplicatesFound = false;
    for (const [email, userList] of Object.entries(emailCounts)) {
      if (userList.length > 1) {
        duplicatesFound = true;
        console.log(`⚠️ Found duplicate entries for email: ${email}`);
        
        // Find which one is admin, and delete the other one
        const adminUser = userList.find(u => u.role === 'admin');
        const nonAdminUsers = userList.filter(u => u.role !== 'admin');

        if (adminUser) {
          console.log(`👉 Keeping Admin User: ID ${adminUser._id} (Name: ${adminUser.name})`);
          for (const nonAdmin of nonAdminUsers) {
            console.log(`❌ Deleting duplicate non-admin User: ID ${nonAdmin._id} (Name: ${nonAdmin.name}, Role: ${nonAdmin.role})`);
            await User.findByIdAndDelete(nonAdmin._id);
          }
        } else {
          // If no admin, keep the verified one, or the oldest one
          console.log('No admin found among the duplicates.');
          const verifiedUser = userList.find(u => u.isVerified);
          const userToKeep = verifiedUser || userList[0];
          console.log(`👉 Keeping User: ID ${userToKeep._id} (Name: ${userToKeep.name})`);
          for (const duplicate of userList) {
            if (duplicate._id.toString() !== userToKeep._id.toString()) {
              console.log(`❌ Deleting duplicate User: ID ${duplicate._id} (Name: ${duplicate.name})`);
              await User.findByIdAndDelete(duplicate._id);
            }
          }
        }
      }
    }

    if (!duplicatesFound) {
      console.log('✅ No duplicate emails found in the database.');
    } else {
      console.log('\n✅ Duplicate entries successfully resolved!');
    }

  } catch (err) {
    console.error('Error running script:', err);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB.');
  }
}

checkAndFixUsers();
