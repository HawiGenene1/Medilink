require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

const email = process.argv[2];

if (!email) {
    console.log('Usage: node activateUser.js <email>');
    process.exit(1);
}

async function activate() {
    try {
        const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/medilink';
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);

        const user = await User.findOne({ email });

        if (!user) {
            console.log(`❌ User with email ${email} not found.`);
            process.exit(1);
        }

        user.status = 'active';
        user.isEmailVerified = true;
        await user.save();

        console.log(`✅ User ${email} (Role: ${user.role}) is now ACTIVE and VERIFIED.`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

activate();
