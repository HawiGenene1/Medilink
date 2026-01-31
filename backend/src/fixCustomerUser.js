require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
const User = require('./models/User');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/medilink';

const fixCustomerUser = async () => {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // 1. Remove existing customer user if any
        console.log('🔍 Checking for existing customer...');
        await User.deleteOne({ email: 'customer@medilink.com' });
        console.log('🗑️  Removed any existing customer@medilink.com user');

        // 2. Create correct customer user
        console.log('➕ Creating correct customer user...');

        // Create new customer
        const customer = new User({
            firstName: 'Jane',
            lastName: 'Customer',
            email: 'customer@medilink.com',
            password: 'Test123', // Will be hashed by pre-save hook
            phone: '+251933333333',
            role: 'customer',
            status: 'active',
            isActive: true,
            lastLogin: new Date(),
            isEmailVerified: true,
            address: {
                street: '456 Customer Ave',
                city: 'Addis Ababa',
                state: 'Addis Ababa',
                zipCode: '1001',
                country: 'Ethiopia'
            }
        });

        await customer.save();

        console.log('✅ Customer user created successfully');
        console.log('📧 Email: customer@medilink.com');
        console.log('🔑 Password: Test123');
        console.log('🎭 Role: customer');
        console.log('🟢 Status: active');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        process.exit(0);
    }
};

fixCustomerUser();
