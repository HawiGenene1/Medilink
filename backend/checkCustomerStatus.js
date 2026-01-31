require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

const checkCustomerStatus = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medilink');
        console.log('✅ Connected to MongoDB\n');

        const user = await User.findOne({ email: 'customer@medilink.com' }).select('+password');

        if (!user) {
            console.log('❌ User NOT FOUND');
            return;
        }

        console.log('📋 Customer Account Details:');
        console.log('   Email:', user.email);
        console.log('   Role:', user.role);
        console.log('   Status:', user.status, user.status === 'active' ? '✅' : '❌ NOT ACTIVE');
        console.log('   isActive:', user.isActive, user.isActive ? '✅' : '❌');
        console.log('   isEmailVerified:', user.isEmailVerified, user.isEmailVerified ? '✅' : '❌');
        console.log('   First Name:', user.firstName);
        console.log('   Last Name:', user.lastName);
        console.log('');

        // Check if status needs to be updated
        if (user.status !== 'active') {
            console.log('⚠️  Status is not "active". Updating...');
            user.status = 'active';
            await user.save();
            console.log('✅ Status updated to "active"');
        } else {
            console.log('✅ All authentication requirements met!');
        }

        console.log('\n🎯 Ready to Login:');
        console.log('   Email: customer@medilink.com');
        console.log('   Password: Password123');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
};

checkCustomerStatus();
