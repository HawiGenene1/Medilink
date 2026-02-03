
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

dotenv.config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected for seeding...');

        const adminEmail = 'sysadmin@medilink.com';
        const plainPassword = 'SysAdmin@123';

        let admin = await User.findOne({ email: adminEmail });

        if (admin) {
            console.log('System Admin exists, updating password and role...');
            admin.password = plainPassword; // Model will hash it on save
            admin.role = 'system_admin';
            admin.status = 'active';
            await admin.save();
            console.log('System Admin updated.');
        } else {
            // Create new System Admin
            admin = new User({
                firstName: 'System',
                lastName: 'Admin',
                email: adminEmail,
                password: plainPassword, // Model will hash it on save
                role: 'system_admin',
                phone: '0900000000',
                isEmailVerified: true,
                status: 'active',
                username: 'systemadmin'
            });
            await admin.save();
            console.log('System Admin created successfully');
        }

        console.log('Email: sysadmin@medilink.com');
        console.log('Password: SysAdmin@123');
        process.exit(0);
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
};

seedAdmin();
