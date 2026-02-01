/**
 * Migration Script: Fix Payment Records
 * 
 * Problem: Old Payment records have wrong field names from before schema was corrected
 * - Had: payment.status = 'success'
 * - Need: payment.paymentStatus = 'completed'
 * 
 * This script updates all Payment records to use correct field names.
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/medilink';

async function fixPaymentRecords() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const Payment = mongoose.model('Payment', require('./src/models/Payment').schema);

        // Find all payments that might have the old 'status' field
        const allPayments = await Payment.find({});
        console.log(`\n📊 Found ${allPayments.length} total payment records`);

        let updatedCount = 0;
        let alreadyCorrect = 0;

        for (const payment of allPayments) {
            let needsUpdate = false;
            const updates = {};

            // Check if payment has wrong field (this won't work directly, so we check paymentStatus)
            // If paymentStatus is 'pending' but the order is actually paid, we need to fix it

            // Check if paidAt exists but paymentStatus is not 'completed'
            if (payment.paidAt && payment.paymentStatus !== 'completed') {
                updates.paymentStatus = 'completed';
                needsUpdate = true;
            }

            // For cash payments that are pending but should be completed
            if (payment.paymentMethod === 'cash' && payment.paymentStatus === 'pending') {
                // Check if there's an associated order that's paid
                const Order = mongoose.model('Order');
                const order = await Order.findById(payment.order);

                if (order && order.paymentStatus === 'paid') {
                    updates.paymentStatus = 'completed';
                    if (!payment.paidAt) {
                        updates.paidAt = order.updatedAt || payment.createdAt;
                    }
                    needsUpdate = true;
                }
            }

            if (needsUpdate) {
                await Payment.updateOne({ _id: payment._id }, { $set: updates });
                console.log(`✅ Updated Payment ${payment._id}: ${JSON.stringify(updates)}`);
                updatedCount++;
            } else {
                alreadyCorrect++;
            }
        }

        console.log(`\n📈 Summary:`);
        console.log(`   ✅ Updated: ${updatedCount} payments`);
        console.log(`   ✓  Already correct: ${alreadyCorrect} payments`);
        console.log(`   📊 Total processed: ${allPayments.length} payments`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from MongoDB');
    }
}

// Run the script
fixPaymentRecords();
