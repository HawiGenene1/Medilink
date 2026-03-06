require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const bcrypt = require('bcryptjs');

const runTest = async () => {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medilink');
        console.log('✅ Connected.\n');

        const testEmail = `test_customer_${Date.now()}@example.com`;
        const { generatePassword } = require('../src/utils/passwordGenerator');
        const testPassword = generatePassword(12);

        console.log(`1. Creating Test Customer: ${testEmail}`);
        console.log(`   Generated Password: ${testPassword}`);

        // Simulate Registration
        const user = new User({
            firstName: 'Test',
            lastName: 'Customer',
            email: testEmail,
            phone: '0911000000',
            role: 'customer',
            status: 'active',
            password: testPassword // Plain text, model should hash
        });

        await user.save();
        console.log(`✅ User saved with ID: ${user._id}`);
        console.log(`   Hashed Password in DB: ${user.password}`);

        // Simulate Login
        console.log('\n2. Attempting Login (simulating authController)...');

        const foundUser = await User.findOne({ email: testEmail }).select('+password');

        if (!foundUser) {
            console.error('❌ User not found by email!');
            return;
        }
        console.log('✅ User found by email.');

        const isMatch = await bcrypt.compare(testPassword, foundUser.password);
        console.log(`3. Password Verification Result: ${isMatch}`);

        if (isMatch) {
            console.log('✅ SUCCESS: Login logic works for this user.');
        } else {
            console.error('❌ FAILURE: Password did not match!');
        }

        // Verify Admin Visibility
        console.log('\n4. Verifying visibility in Admin List logic...');
        // Default filter in adminController is { status: { $ne: 'rejected' } }
        // plus optional search

        const adminQuery = { status: { $ne: 'rejected' }, email: testEmail };
        const adminResult = await User.findOne(adminQuery);

        if (adminResult) {
            console.log('✅ SUCCESS: User is visible to Admin User Management.');
        } else {
            console.error('❌ FAILURE: User NOT visible to Admin User Management!');
        }

        // Clean up
        await User.deleteOne({ _id: user._id });
        console.log('\n🧹 Test user cleaned up.');

    } catch (error) {
        console.error('❌ Error during test:', error);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
};

runTest();
