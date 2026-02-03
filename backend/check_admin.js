require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/medilink';

async function checkAdmin() {
    try {
        await mongoose.connect(MONGO_URI);
        const user = await User.findOne({ email: 'admin@medilink.com' });
        if (user) {
            console.log('ADMIN USER DATA:');
            console.log(JSON.stringify({
                id: user._id,
                email: user.email,
                role: user.role,
                status: user.status
            }, null, 2));
        } else {
            console.log('Admin user not found!');
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.connection.close();
    }
}

checkAdmin();
