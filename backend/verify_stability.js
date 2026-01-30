require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./src/models/Order');
const Medicine = require('./src/models/Medicine');
const User = require('./src/models/User');

const verifyStability = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medilink');
        console.log('Connected to DB');

        const cashier = await User.findOne({ role: 'cashier' });
        if (!cashier) {
            console.log('No cashier user found to test with');
            return;
        }

        console.log('Testing Dashboard Stats Query...');
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // This query previously might have failed if 'cashier' field was missing in schema
        const pendingCount = await Order.countDocuments({
            cashier: cashier._id,
            paymentStatus: 'pending',
            createdAt: { $gte: today }
        });
        console.log('Pending Payments Count:', pendingCount);

        console.log('Testing Medicine Alerts Query...');
        // This query would have failed if 'expiryDate' was missing
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        const expiringCount = await Medicine.countDocuments({
            expiryDate: { $gte: new Date(), $lte: thirtyDaysFromNow }
        });
        console.log('Expiring Soon Count:', expiringCount);

        console.log('STABILITY CHECK PASSED: No schema errors detected.');

    } catch (e) {
        console.error('STABILITY CHECK FAILED:', e);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
};

verifyStability();
