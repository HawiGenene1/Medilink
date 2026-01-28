const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
require('dotenv').config();

async function createTestAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'admin@medilink.com' });
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email);
      return;
    }

    // Create test admin user
    const adminUser = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@medilink.com',
      password: 'admin123', // Model will hash this automatically
      role: 'admin',
      phone: '+1234567890',
      isActive: true
    });

    const savedUser = await adminUser.save();
    console.log('Test admin user created successfully:', savedUser.email);

    // Test user retrieval
    const allUsers = await User.find({}).select('-password');
    console.log(`Total users in database: ${allUsers.length}`);

    // Test admin user query
    const adminUsers = await User.find({ role: 'admin' }).select('-password');
    console.log(`Admin users found: ${adminUsers.length}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createTestAdmin();
