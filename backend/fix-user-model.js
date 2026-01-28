const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function fixUserModel() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Drop the users collection to remove the problematic index
    const db = mongoose.connection.db;
    await db.collection('users').drop();
    console.log('Dropped users collection to remove old indexes');

    // Recreate the admin user
    const User = require('./src/models/User');
    
    // Hash password manually
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@medilink.com',
      password: hashedPassword,
      role: 'admin',
      phone: '+1234567890',
      isActive: true
    });

    const savedUser = await adminUser.save();
    console.log('Admin user recreated successfully:', savedUser.email);

    // Create test users
    const customerPassword = await bcrypt.hash('customer123', 10);
    const customer = new User({
      firstName: 'Test',
      lastName: 'Customer',
      email: 'customer@test.com',
      password: customerPassword,
      role: 'customer',
      phone: '+1234567891',
      isActive: true
    });
    await customer.save();
    console.log('Test customer created successfully');

    const pharmacyPassword = await bcrypt.hash('pharmacy123', 10);
    const pharmacyAdmin = new User({
      firstName: 'Test',
      lastName: 'PharmacyAdmin',
      email: 'pharmacy@test.com',
      password: pharmacyPassword,
      role: 'pharmacy_admin',
      phone: '+1234567892',
      isActive: true,
      pharmacyId: null // Make it optional for testing
    });
    await pharmacyAdmin.save();
    console.log('Test pharmacy admin created successfully');

    // Verify all users
    const allUsers = await User.find({}).select('-password');
    console.log(`\nTotal users created: ${allUsers.length}`);
    allUsers.forEach(user => {
      console.log(`- ${user.firstName} ${user.lastName} (${user.email}) - Role: ${user.role}`);
    });

    console.log('\n=== User Model Fixed ===');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixUserModel();
