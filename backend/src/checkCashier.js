require('dotenv').config();
const mongoose = require('mongoose');

// Import models
const User = require('./models/User');
const Role = require('./models/Role');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/medilink';

const checkCashierUser = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check if cashier role exists
    console.log('🔍 Checking for cashier role...');
    const cashierRole = await Role.findOne({ name: 'cashier' });
    
    if (!cashierRole) {
      console.log('❌ Cashier role not found');
      return;
    } else {
      console.log('✅ Cashier role found:', cashierRole._id);
    }

    // Check if cashier user exists
    console.log('🔍 Checking for cashier user...');
    const cashierUser = await User.findOne({ email: 'cashier@medilink.com' }).populate('role');
    
    if (!cashierUser) {
      console.log('❌ Cashier user not found');
    } else {
      console.log('✅ Cashier user found:');
      console.log('📧 Email:', cashierUser.email);
      console.log('👤 Username:', cashierUser.username);
      console.log('🔑 Password exists:', !!cashierUser.password);
      console.log('🏷️ Role:', cashierUser.role?.name);
      console.log('✅ Active:', cashierUser.isActive);
      console.log('✅ Email verified:', cashierUser.isEmailVerified);
    }

    console.log('\n🎉 Check complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

checkCashierUser();
