const mongoose = require('mongoose');
const User = require('../src/models/User');
require('dotenv').config();

async function forceResetPassword() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/medilink';
        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('✓ Connected to MongoDB');

        const email = 'pharmacyadmin@medilink.com';
        const newPassword = 'Admin@123456';

        // Find the user (without password field first)
        let user = await User.findOne({ email });

        if (!user) {
            console.log('\n❌ User not found with email:', email);
            await mongoose.connection.close();
            process.exit(1);
        }

        console.log('\n📋 Current user:');
        console.log('Name:', `${user.firstName} ${user.lastName}`);
        console.log('Email:', user.email);
        console.log('Role:', user.role);

        // Update user with new password - this will trigger the pre-save hook to hash it
        console.log('\n🔄 Setting new password...');
        user.password = newPassword;  // Set plain text password
        user.status = 'active';
        user.isEmailVerified = true;
        user.isActive = true;

        // Save - the pre-save hook will hash the password
        await user.save();

        console.log('\n✓ Password has been reset!\n');
        console.log('═══════════════════════════════════════');
        console.log('  LOGIN CREDENTIALS');
        console.log('═══════════════════════════════════════');
        console.log('Email:    ', email);
        console.log('Password: ', newPassword);
        console.log('Role:     ', user.role);
        console.log('Status:   ', user.status);
        console.log('═══════════════════════════════════════\n');
        console.log('→ Login URL: http://localhost:3000/auth/login\n');

        // Verify the password was set correctly
        const verifyUser = await User.findOne({ email }).select('+password');
        const bcrypt = require('bcryptjs');
        const isMatch = await bcrypt.compare(newPassword, verifyUser.password);
        console.log('✓ Password verification:', isMatch ? 'SUCCESS' : 'FAILED');

        await mongoose.connection.close();
        console.log('\n✓ Database connection closed');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (error.errors) {
            Object.keys(error.errors).forEach(key => {
                console.error(`  - ${key}: ${error.errors[key].message}`);
            });
        }
        await mongoose.connection.close();
        process.exit(1);
    }
}

forceResetPassword();
