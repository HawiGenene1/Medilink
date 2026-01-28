require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');

async function createTestUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Check if user already exists
    const existingUser = await User.findOne({ email: 'test@medilink.com' });
    if (existingUser) {
      console.log('Test user already exists:', existingUser.email);
      process.exit(0);
    }

    // Create test user
    const hashedPassword = await bcrypt.hash('test1234', 10);
    
    const testUser = new User({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@medilink.com',
      username: 'testuser',
      password: hashedPassword,
      role: 'customer',
      phone: '+251911223344',
      isEmailVerified: true
    });

    await testUser.save();
    console.log('Test user created successfully:', testUser.email);
    
  } catch (error) {
    console.error('Error creating test user:', error.message);
    if (error.errors) {
      console.error('Validation errors:', error.errors);
    }
  } finally {
    // Close the connection
    await mongoose.connection.close();
    process.exit(0);
  }
}

createTestUser();
