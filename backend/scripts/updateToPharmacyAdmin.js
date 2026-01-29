const mongoose = require('mongoose');
const User = require('../src/models/User');
require('dotenv').config();

async function updateToPharmacyAdmin() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/medilink';
        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('✓ Connected to MongoDB');

        const email = 'pharmacyadmin@medilink.com';

        // Find the existing user
        const user = await User.findOne({ email });

        if (!user) {
            console.log('\n❌ User not found with email:', email);
            console.log('Please run createPharmacyAdmin.js first.');
            await mongoose.connection.close();
            process.exit(1);
        }

        console.log('\n📋 Current user details:');
        console.log('Name:', `${user.firstName} ${user.lastName}`);
        console.log('Email:', user.email);
        console.log('Current Role:', user.role);
        console.log('Status:', user.status);

        // Update the role to pharmacy_admin
        console.log('\n🔄 Updating role to pharmacy_admin...');
        user.role = 'pharmacy_admin';
        user.status = 'active'; // Ensure it's active
        user.isEmailVerified = true; // Ensure email is verified
        await user.save();

        console.log('\n✓ User updated successfully!\n');
        console.log('═══════════════════════════════════════');
        console.log('  UPDATED LOGIN CREDENTIALS');
        console.log('═══════════════════════════════════════');
        console.log('Email:    ', user.email);
        console.log('Password: ', '(unchanged - use your existing password)');
        console.log('Role:     ', user.role);
        console.log('Status:   ', user.status);
        console.log('═══════════════════════════════════════\n');
        console.log('→ Login URL: http://localhost:3000/auth/login');
        console.log('→ Dashboard: http://localhost:3000/pharmacy-admin/dashboard\n');

        await mongoose.connection.close();
        console.log('✓ Database connection closed');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error updating user:', error.message);
        await mongoose.connection.close();
        process.exit(1);
    }
}

updateToPharmacyAdmin();
