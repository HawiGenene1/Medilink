const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const Order = mongoose.model('Order', require('./src/models/Order').schema);

    const pendingCount = await Order.countDocuments({ status: 'pending' });
    const pendingNoCourier = await Order.countDocuments({
        status: 'pending',
        $or: [{ courier: { $exists: false } }, { courier: null }]
    });

    const latest = await Order.findOne().sort({ createdAt: -1 });

    console.log('=== ORDER STATS ===');
    console.log('Total pending orders:', pendingCount);
    console.log('Pending without courier:', pendingNoCourier);
    console.log('\n=== LATEST ORDER ===');
    if (latest) {
        console.log('Order Number:', latest.orderNumber);
        console.log('Status:', latest.status);
        console.log('Courier:', latest.courier || 'NONE');
        console.log('Created:', latest.createdAt);
    } else {
        console.log('No orders found');
    }

    process.exit(0);
}).catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
