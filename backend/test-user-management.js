const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

async function testUserManagement() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Test 1: Get all users
    console.log('\n=== Test 1: Get all users ===');
    const allUsers = await User.find({}).select('-password');
    console.log(`Total users found: ${allUsers.length}`);
    allUsers.forEach(user => {
      console.log(`- ${user.firstName} ${user.lastName} (${user.email}) - Role: ${user.role}`);
    });

    // Test 2: Get admin users
    console.log('\n=== Test 2: Get admin users ===');
    const adminUsers = await User.find({ role: 'admin' }).select('-password');
    console.log(`Admin users found: ${adminUsers.length}`);
    adminUsers.forEach(user => {
      console.log(`- ${user.firstName} ${user.lastName} (${user.email})`);
    });

    // Test 3: Create a test customer user
    console.log('\n=== Test 3: Create test customer ===');
    const existingCustomer = await User.findOne({ email: 'customer@test.com' });
    if (!existingCustomer) {
      const customer = new User({
        firstName: 'Test',
        lastName: 'Customer',
        email: 'customer@test.com',
        password: 'customer123',
        role: 'customer',
        phone: '+1234567891',
        isActive: true
      });
      await customer.save();
      console.log('Test customer created successfully');
    } else {
      console.log('Test customer already exists');
    }

    // Test 4: Create a test pharmacy admin
    console.log('\n=== Test 4: Create test pharmacy admin ===');
    const existingPharmacyAdmin = await User.findOne({ email: 'pharmacy@test.com' });
    if (!existingPharmacyAdmin) {
      const pharmacyAdmin = new User({
        firstName: 'Test',
        lastName: 'PharmacyAdmin',
        email: 'pharmacy@test.com',
        password: 'pharmacy123',
        role: 'pharmacy_admin',
        phone: '+1234567892',
        isActive: true
      });
      await pharmacyAdmin.save();
      console.log('Test pharmacy admin created successfully');
    } else {
      console.log('Test pharmacy admin already exists');
    }

    // Test 5: Test user filtering
    console.log('\n=== Test 5: Test user filtering ===');
    const activeUsers = await User.find({ isActive: true }).select('-password');
    console.log(`Active users: ${activeUsers.length}`);

    const customerUsers = await User.find({ role: 'customer' }).select('-password');
    console.log(`Customer users: ${customerUsers.length}`);

    console.log('\n=== User Management Tests Complete ===');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testUserManagement();
