require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const bcrypt = require('bcryptjs');

const resetPassword = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medilink');
        console.log('✅ Connected to MongoDB\n');

        // Hash the new password
        const newPassword = 'Password123';
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the user's password
        const result = await User.findOneAndUpdate(
            { email: 'customer@medilink.com' },
            {
                password: hashedPassword,
                isActive: true,
                isEmailVerified: true
            },
            { new: true }
        ).select('+password');

        if (!result) {
            console.log('❌ User not found');
            return;
        }

        console.log('✅ Password reset successfully!');
        console.log('\n📋 Login Credentials:');
        console.log('   Email: customer@medilink.com');
        console.log('   Password: Password123');
        console.log('   Role:', result.role);
        console.log('');

        // Verify the password works
        const isMatch = await bcrypt.compare(newPassword, result.password);
        console.log('🔐 Password verification:', isMatch ? '✅ PASSED' : '❌ FAILED');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
};

resetPassword();
