const mongoose = require('mongoose');
const User = require('../src/models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function resetPharmacyAdminPassword() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/medilink';
        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('✓ Connected to MongoDB');

        const email = 'pharmacyadmin@medilink.com';
        const newPassword = 'Admin@123456';

        // Find the user
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            console.log('\n❌ User not found with email:', email);
            await mongoose.connection.close();
            process.exit(1);
        }

        console.log('\n📋 Current user details:');
        console.log('Name:', `${user.firstName} ${user.lastName}`);
        console.log('Email:', user.email);
        console.log('Role:', user.role);
        console.log('Status:', user.status);

        // Hash the new password
        console.log('\n🔄 Resetting password...');
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        // Ensure status is active
        user.status = 'active';
        user.isEmailVerified = true;

        await user.save();

        console.log('\n✓ Password reset successfully!\n');
        console.log('═══════════════════════════════════════');
        console.log('  NEW LOGIN CREDENTIALS');
        console.log('═══════════════════════════════════════');
        console.log('Email:    ', email);
        console.log('Password: ', newPassword);
        console.log('Role:     ', user.role);
        console.log('Status:   ', user.status);
        console.log('═══════════════════════════════════════\n');
        console.log('→ Login URL: http://localhost:3000/auth/login');
        console.log('→ Dashboard: http://localhost:3000/pharmacy-admin/dashboard\n');

        await mongoose.connection.close();
        console.log('✓ Database connection closed');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error resetting password:', error.message);
        await mongoose.connection.close();
        process.exit(1);
    }
}

resetPharmacyAdminPassword();
