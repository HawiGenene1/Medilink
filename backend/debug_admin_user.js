const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./src/models/User');

async function debugUser() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const user = await User.findOne({ email: 'pharmacyadmin@medilink.com' });
        if (!user) {
            console.log('User not found');
            return;
        }

        console.log('User Debug Information:');
        console.log('ID:', user._id);
        console.log('Name:', user.firstName, user.lastName);
        console.log('Email:', user.email);
        console.log('Role:', user.role);
        console.log('Avatar Path:', user.avatar);
        console.log('Created At:', user.createdAt);

    } catch (err) {
        console.error('Debug error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

debugUser();
