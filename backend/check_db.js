require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Pharmacy = require('./src/models/Pharmacy');
const Category = require('./src/models/Category');
const Medicine = require('./src/models/Medicine');
const Order = require('./src/models/Order');

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log(`USERS: ${await User.countDocuments()}`);
        console.log(`ACTIVE USERS: ${await User.countDocuments({ status: 'active' })}`);
        console.log(`PHARMACIES: ${await Pharmacy.countDocuments()}`);
        console.log(`CATEGORIES: ${await Category.countDocuments()}`);
        console.log(`MEDICINES: ${await Medicine.countDocuments()}`);
        console.log(`ORDERS: ${await Order.countDocuments()}`);
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.connection.close();
    }
};
check();
