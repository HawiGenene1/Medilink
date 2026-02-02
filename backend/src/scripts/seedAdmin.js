
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

dotenv.config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected for seeding...');

        const adminEmail = 'admin@medilink.com';
        const hashedPassword = await bcrypt.hash('Admin@123', 10);

        let admin = await User.findOne({ email: adminEmail });

        if (admin) {
            console.log('Admin exists, updating password...');
            admin.password = hashedPassword;
            await admin.save();
            console.log('Admin password updated.');
        } else {
            // Create new Admin
            admin = new User({
                firstName: 'Super',
                lastName: 'Admin',
                email: adminEmail,
                password: hashedPassword,
                role: 'admin',
                phone: '0911000000',
                isEmailVerified: true,
                username: 'superadmin'
            });
            await admin.save();
            console.log('Super Admin created successfully');
        }

        console.log('Email: admin@medilink.com');
        console.log('Password: Admin@123');
        process.exit(0);
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
};

seedAdmin();
