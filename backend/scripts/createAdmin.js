require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/medilink';

async function createAdmin() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected!');

        const adminEmail = 'admin@medilink.com';
        const adminPassword = 'adminpassword123'; // Change this in production

        let admin = await User.findOne({ email: adminEmail });

        if (admin) {
            console.log('Admin user already exists. Updating to ensure admin role and active status...');
            admin.role = 'admin';
            admin.status = 'active';
            admin.isEmailVerified = true;
            admin.password = adminPassword; // This will trigger the pre-save hook to hash it
            await admin.save();
        } else {
            console.log('Creating new admin user...');
            admin = new User({
                firstName: 'System',
                lastName: 'Administrator',
                email: adminEmail,
                password: adminPassword,
                phone: '0000000000',
                role: 'admin',
                status: 'active',
                isEmailVerified: true
            });
            await admin.save();
        }

        console.log('✅ Admin user ready!');
        console.log(`Email: ${adminEmail}`);
        console.log(`Password: ${adminPassword}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

createAdmin();
