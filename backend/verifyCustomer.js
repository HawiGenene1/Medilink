require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const bcrypt = require('bcryptjs');

const verifyCustomer = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medilink');
        console.log('Connected to DB');

        const user = await User.findOne({ email: 'customer@medilink.com' }).select('+password');
        if (!user) {
            console.log('User NOT FOUND');
        } else {
            console.log('User FOUND:', user.email);
            const isMatch = await bcrypt.compare('Test123', user.password);
            console.log('Password Match for "Test123":', isMatch);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
};

verifyCustomer();
