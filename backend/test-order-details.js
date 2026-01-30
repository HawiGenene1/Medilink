const mongoose = require('mongoose');
require('dotenv').config();

const orderId = process.argv[2];

if (!orderId) {
    console.error('Usage: node test-order-details.js <orderId>');
    process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const Order = mongoose.model('Order', require('./src/models/Order').schema);

    const order = await Order.findById(orderId)
        .populate('customer', 'firstName lastName name email phone')
        .populate('pharmacy', 'name address location phone')
        .populate('courier', 'firstName lastName name email phone');

    if (!order) {
        console.log('Order not found');
    } else {
        console.log('=== ORDER DETAILS ===');
        console.log('Order Number:', order.orderNumber);
        console.log('Status:', order.status);
        console.log('\n=== CUSTOMER ===');
        console.log('Customer:', JSON.stringify(order.customer, null, 2));
        console.log('\n=== PHARMACY ===');
        console.log('Pharmacy:', JSON.stringify(order.pharmacy, null, 2));
        console.log('\n=== ADDRESS ===');
        console.log('Address:', JSON.stringify(order.address, null, 2));
        console.log('\n=== COURIER ===');
        console.log('Courier:', order.courier ? JSON.stringify(order.courier, null, 2) : 'NONE');
    }

    process.exit(0);
}).catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
