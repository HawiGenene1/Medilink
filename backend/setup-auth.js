require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
const User = require('./src/models/User');
const Role = require('./src/models/Role');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/medilink';

const setupAuth = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Create roles (only if they don't exist)
    console.log('👑 Creating roles...');
    const existingRoles = await Role.find();
    let roles;
    
    if (existingRoles.length === 0) {
      roles = await Role.create([
        { name: 'customer', permissions: ['read_medicines', 'create_orders', 'read_own_orders'] },
        { name: 'pharmacy_staff', permissions: ['read_medicines', 'update_medicines', 'read_orders', 'update_orders'] },
        { name: 'pharmacy_admin', permissions: ['read_medicines', 'create_medicines', 'update_medicines', 'delete_medicines', 'read_orders', 'manage_staff'] },
        { name: 'cashier', permissions: ['read_medicines', 'create_orders', 'process_payments'] },
        { name: 'delivery', permissions: ['read_orders', 'update_delivery_status'] },
        { name: 'admin', permissions: ['full_access'] }
      ]);
      console.log(`✅ Created ${roles.length} roles\n`);
    } else {
      roles = existingRoles;
      console.log(`✅ Found ${roles.length} existing roles\n`);
    }

    // Create test users
    console.log('👥 Creating test users...');
    const userPassword = '123';

    const customerRole = roles.find(r => r.name === 'customer');
    const adminRole = roles.find(r => r.name === 'admin');
    const pharmacyRole = roles.find(r => r.name === 'pharmacy_admin');
    const staffRole = roles.find(r => r.name === 'pharmacy_staff');
    const cashierRole = roles.find(r => r.name === 'cashier');

    const users = [];
    const userData = [
      {
        firstName: 'Test',
        lastName: 'Customer',
        email: 'customer@test.com',
        username: 'customer',
        password: userPassword,
        phone: '+251912345678',
        role: customerRole._id,
        isActive: true,
        isEmailVerified: true
      },
      {
        firstName: 'Test',
        lastName: 'Admin',
        email: 'admin@test.com',
        username: 'admin',
        password: userPassword,
        phone: '+251912345679',
        role: adminRole._id,
        isActive: true,
        isEmailVerified: true
      },
      {
        firstName: 'Test',
        lastName: 'Pharmacy',
        email: 'pharmacy@test.com',
        username: 'pharmacy',
        password: userPassword,
        phone: '+251912345680',
        role: pharmacyRole._id,
        isActive: true,
        isEmailVerified: true
      },
      {
        firstName: 'Test',
        lastName: 'Staff',
        email: 'staff@test.com',
        username: 'staff',
        password: userPassword,
        phone: '+251912345681',
        role: staffRole._id,
        isActive: true,
        isEmailVerified: true
      },
      {
        firstName: 'Test',
        lastName: 'Cashier',
        email: 'cashier@test.com',
        username: 'cashier',
        password: userPassword,
        phone: '+251912345682',
        role: cashierRole._id,
        isActive: true,
        isEmailVerified: true
      }
    ];

    for (const data of userData) {
      try {
        const user = new User(data);
        await user.save();
        users.push(user);
      } catch (error) {
        console.error(`Error creating user ${data.email}:`, error.message);
      }
    }

    console.log(`✅ Created ${users.length} test users\n`);
    console.log('🎉 Auth setup completed successfully!');
    console.log('\n📋 Test Users:');
    console.log('   Customer: customer@test.com / 123');
    console.log('   Admin: admin@test.com / 123');
    console.log('   Pharmacy: pharmacy@test.com / 123');
    console.log('   Staff: staff@test.com / 123');
    console.log('   Cashier: cashier@test.com / 123');

  } catch (error) {
    console.error('❌ Error setting up auth:', error);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
    process.exit(0);
  }
};

// Run the setup
setupAuth();
