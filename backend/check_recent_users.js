const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./src/models/User');

const checkUser = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medilink');
        console.log('Connected to DB');

        // Find the most recently created users
        const users = await User.find({})
            .sort({ createdAt: -1 })
            .limit(3) // Limit to 3 to avoid truncation
            .select('firstName lastName email role status isActive createdAt');

        console.log('Recent Users:');
        users.forEach(u => {
            console.log(`User: ${u.firstName} ${u.lastName}`);
            console.log(`Email: ${u.email}`);
            console.log(`Role: ${u.role}`);
            console.log(`Status: ${u.status}`);
            console.log(`Active: ${u.isActive}`);
            console.log('-------------------');
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkUser();
