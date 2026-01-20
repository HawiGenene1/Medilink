require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

const cleanUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medilink');
        console.log('Connected to DB');
        await User.deleteMany({});
        console.log('Cleared all users.');
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
};

cleanUsers();
