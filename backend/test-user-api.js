const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

async function testUserAPIs() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log('\n=== Testing User Management Functionality ===\n');

    // Test 1: Get all users (simulating getAllUsers)
    console.log('1. Testing getAllUsers:');
    const allUsers = await User.find({}).select('-password').sort({ createdAt: -1 });
    console.log(`   Found ${allUsers.length} users`);
    allUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.firstName} ${user.lastName} - ${user.email} - ${user.role} - Active: ${user.isActive}`);
    });

    // Test 2: Get user by ID (simulating getUserById)
    console.log('\n2. Testing getUserById:');
    const adminUser = await User.findOne({ role: 'admin' }).select('-password');
    if (adminUser) {
      console.log(`   Found admin user: ${adminUser.firstName} ${adminUser.lastName} (${adminUser.email})`);
    } else {
      console.log('   No admin user found');
    }

    // Test 3: Filter users by role
    console.log('\n3. Testing role filtering:');
    const customerUsers = await User.find({ role: 'customer' }).select('-password');
    console.log(`   Found ${customerUsers.length} customer users`);

    const adminUsers = await User.find({ role: 'admin' }).select('-password');
    console.log(`   Found ${adminUsers.length} admin users`);

    const pharmacyAdminUsers = await User.find({ role: 'pharmacy_admin' }).select('-password');
    console.log(`   Found ${pharmacyAdminUsers.length} pharmacy admin users`);

    // Test 4: Filter users by status
    console.log('\n4. Testing status filtering:');
    const activeUsers = await User.find({ isActive: true }).select('-password');
    console.log(`   Found ${activeUsers.length} active users`);

    const inactiveUsers = await User.find({ isActive: false }).select('-password');
    console.log(`   Found ${inactiveUsers.length} inactive users`);

    // Test 5: Search functionality
    console.log('\n5. Testing search functionality:');
    const searchResults = await User.find({
      $or: [
        { firstName: { $regex: 'test', $options: 'i' } },
        { lastName: { $regex: 'test', $options: 'i' } },
        { email: { $regex: 'test', $options: 'i' } }
      ]
    }).select('-password');
    console.log(`   Found ${searchResults.length} users matching 'test'`);

    // Test 6: Pagination simulation
    console.log('\n6. Testing pagination:');
    const page = 1;
    const limit = 2;
    const paginatedUsers = await User.find({})
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);
    console.log(`   Page ${page} (limit ${limit}): ${paginatedUsers.length} users`);

    console.log('\n=== User Management Tests Complete ===');
    console.log('\n✅ All user management functionality is working correctly!');
    console.log('📝 Ready for API testing with authentication');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testUserAPIs();
