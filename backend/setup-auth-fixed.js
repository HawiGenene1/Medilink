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

    // Get existing roles
    const roles = await Role.find();
    console.log(`✅ Found ${roles.length} existing roles\n`);

    // Create test users manually
    console.log('👥 Creating test users...');
    const userPassword = '123';
    const hashedPassword = await bcrypt.hash(userPassword, 10);

    const customerRole = roles.find(r => r.name === 'customer');
    const adminRole = roles.find(r => r.name === 'admin');
    const pharmacyRole = roles.find(r => r.name === 'pharmacy_admin');
    const staffRole = roles.find(r => r.name === 'pharmacy_staff');
    const cashierRole = roles.find(r => r.name === 'cashier');

    // Use direct MongoDB insertion to bypass middleware
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    const userData = [
      {
        firstName: 'Test',
        lastName: 'Customer',
        email: 'customer@test.com',
        username: 'customer',
        password: hashedPassword,
        phone: '+251912345678',
        role: customerRole._id,
        isActive: true,
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        firstName: 'Test',
        lastName: 'Admin',
        email: 'admin@test.com',
        username: 'admin',
        password: hashedPassword,
        phone: '+251912345679',
        role: adminRole._id,
        isActive: true,
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        firstName: 'Test',
        lastName: 'Pharmacy',
        email: 'pharmacy@test.com',
        username: 'pharmacy',
        password: hashedPassword,
        phone: '+251912345680',
        role: pharmacyRole._id,
        isActive: true,
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        firstName: 'Test',
        lastName: 'Staff',
        email: 'staff@test.com',
        username: 'staff',
        password: hashedPassword,
        phone: '+251912345681',
        role: staffRole._id,
        isActive: true,
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        firstName: 'Test',
        lastName: 'Cashier',
        email: 'cashier@test.com',
        username: 'cashier',
        password: hashedPassword,
        phone: '+251912345682',
        role: cashierRole._id,
        isActive: true,
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const users = [];
    for (const data of userData) {
      try {
        // Check if user already exists
        const existingUser = await usersCollection.findOne({ email: data.email });
        if (!existingUser) {
          const result = await usersCollection.insertOne(data);
          users.push({ ...data, _id: result.insertedId });
          console.log(`✅ Created user: ${data.email}`);
        } else {
          console.log(`ℹ️  User already exists: ${data.email}`);
          users.push(existingUser);
        }
      } catch (error) {
        console.error(`Error creating user ${data.email}:`, error.message);
      }
    }

    console.log(`✅ Total users: ${users.length}\n`);
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
