const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const Order = mongoose.model('Order', require('./src/models/Order').schema);

    const orders = await Order.find({
        status: 'pending',
        $or: [
            { courier: { $exists: false } },
            { courier: null }
        ]
    }).select('orderNumber status courier createdAt').limit(10);

    console.log('=== AVAILABLE ORDERS FOR DELIVERY ===');
    console.log('Count:', orders.length);
    orders.forEach((order, idx) => {
        console.log(`\n${idx + 1}. ${order.orderNumber}`);
        console.log('   Status:', order.status);
        console.log('   Courier:', order.courier || 'NONE');
        console.log('   Created:', order.createdAt);
    });

    process.exit(0);
}).catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
