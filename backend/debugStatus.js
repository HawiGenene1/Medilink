const mongoose = require('mongoose');
const Order = require('./src/models/Order');
require('dotenv').config();

const debug = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const pendingCount = await Order.countDocuments({ paymentStatus: 'pending' });
        const paidCount = await Order.countDocuments({ paymentStatus: 'paid' });
        const allCount = await Order.countDocuments({});

        console.log(`Pending: ${pendingCount}`);
        console.log(`Paid: ${paidCount}`);
        console.log(`Total: ${allCount}`);

        if (pendingCount + paidCount !== allCount) {
            console.log('Mismatch! Other statuses exist.');
            const others = await Order.find({ paymentStatus: { $nin: ['pending', 'paid'] } });
            console.log('Others:', others.map(o => o.paymentStatus));
        }

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

debug();
