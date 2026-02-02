require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const bcrypt = require('bcryptjs');

const checkUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medilink');
        console.log('Connected to DB');

        const users = await User.find({});
        console.log(`Found ${users.length} users:`);

        for (const user of users) {
            console.log(`- ${user.email} (Role: ${user.role})`);
            if (user.email === 'customer@medilink.com') {
                const isMatch = await bcrypt.compare('Test123', user.password);
                console.log(`  -> Password 'Test123' match: ${isMatch}`);
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
};

checkUsers();
