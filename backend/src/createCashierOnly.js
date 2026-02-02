require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
const User = require('./models/User');
const Role = require('./models/Role');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/medilink';

const createCashierOnly = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check if cashier role exists
    console.log('🔍 Checking for cashier role...');
    let cashierRole = await Role.findOne({ name: 'cashier' });
    
    if (!cashierRole) {
      console.log('➕ Creating cashier role...');
      cashierRole = await Role.create({
        name: 'cashier',
        permissions: ['view_orders', 'verify_payments', 'process_refunds', 'generate_invoices']
      });
      console.log('✅ Cashier role created\n');
    } else {
      console.log('✅ Cashier role already exists\n');
    }

    // Check if cashier user exists
    console.log('🔍 Checking for cashier user...');
    const existingCashier = await User.findOne({ email: 'cashier@medilink.com' });
    
    if (!existingCashier) {
      console.log('➕ Creating cashier user...');
      
      // Hash password manually
      const hashedPassword = await bcrypt.hash('Cashier123', 12);
      
      // Create user without triggering pre-save hook
      const cashier = new User({
        firstName: 'Cashier',
        lastName: 'User',
        email: 'cashier@medilink.com',
        password: hashedPassword, // Use pre-hashed password
        username: 'cashier',
        role: cashierRole._id,
        isActive: true,
        isEmailVerified: true
      });
      
      // Save without triggering pre-save hook by marking password as not modified
      cashier.isNew = true;
      await cashier.save();
      
      console.log('✅ Cashier user created');
      console.log('📧 Email: cashier@medilink.com');
      console.log('🔑 Password: Cashier123');
    } else {
      console.log('✅ Cashier user already exists');
    }

    console.log('\n🎉 Cashier setup complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

createCashierOnly();
