const mongoose = require('mongoose');
const User = require('../src/models/User');
require('dotenv').config();

async function createPharmacyAdmin() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/medilink';
        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('✓ Connected to MongoDB');

        const adminData = {
            firstName: 'Pharmacy',
            lastName: 'Admin',
            email: 'pharmacyadmin@medilink.com',
            password: 'Admin@123456', // Will be hashed by the pre-save hook
            phone: '+251911234567',
            role: 'pharmacy_admin',
            status: 'active',
            isEmailVerified: true,
            isActive: true
        };

        // Check if user already exists
        const existingUser = await User.findOne({ email: adminData.email });
        if (existingUser) {
            console.log('\n⚠️  Pharmacy Admin user already exists!');
            console.log('Email:', existingUser.email);
            console.log('Role:', existingUser.role);
            console.log('Status:', existingUser.status);
            console.log('\nIf you forgot the password, you can reset it or delete this user and run the script again.');
            await mongoose.connection.close();
            process.exit(0);
        }

        // Create new pharmacy admin user
        console.log('\nCreating Pharmacy Admin user...');
        const user = new User(adminData);
        await user.save();

        console.log('\n✓ Pharmacy Admin created successfully!\n');
        console.log('═══════════════════════════════════════');
        console.log('  LOGIN CREDENTIALS');
        console.log('═══════════════════════════════════════');
        console.log('Email:    ', adminData.email);
        console.log('Password: ', 'Admin@123456');
        console.log('Role:     ', adminData.role);
        console.log('Status:   ', adminData.status);
        console.log('═══════════════════════════════════════\n');
        console.log('→ Login URL: http://localhost:3000/auth/login');
        console.log('→ Dashboard: http://localhost:3000/pharmacy-admin/dashboard\n');

        await mongoose.connection.close();
        console.log('✓ Database connection closed');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error creating pharmacy admin:', error.message);
        if (error.errors) {
            Object.keys(error.errors).forEach(key => {
                console.error(`  - ${key}: ${error.errors[key].message}`);
            });
        }
        await mongoose.connection.close();
        process.exit(1);
    }
}

createPharmacyAdmin();
