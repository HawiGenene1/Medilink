require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
const User = require('./models/User');
const Role = require('./models/Role');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/medilink';

const testCashierLogin = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Test login with cashier credentials
    console.log('🔍 Testing cashier login...');
    const email = 'cashier@medilink.com';
    const password = 'Cashier123';

    // Find user with password field
    const user = await User.findOne({ email }).select('+password').populate('role');
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('✅ User found:', user.email);
    console.log('🔑 Password exists in DB:', !!user.password);
    console.log('🏷️ Role:', user.role?.name);
    console.log('✅ Active:', user.isActive);

    if (!user.password) {
      console.log('❌ Password field is empty - this is the problem!');
      return;
    }

    // Test password comparison
    console.log('🔐 Testing password comparison...');
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('🔍 Password match:', isMatch);

    if (isMatch) {
      console.log('✅ Login should work!');
    } else {
      console.log('❌ Password does not match');
    }
    
    console.log('\n🎉 Test complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

testCashierLogin();
