const mongoose = require('mongoose');
require('dotenv').config();
const Medicine = require('../src/models/Medicine');
const Order = require('../src/models/Order');
const Pharmacy = require('../src/models/Pharmacy');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const validPharmacyId = '6981ea42c5d027c424974c8f';
        const pharmacy = await Pharmacy.findById(validPharmacyId);

        if (!pharmacy) {
            console.error('Target pharmacy not found!');
            process.exit(1);
        }

        console.log(`Fixing data for Pharmacy: ${pharmacy.name} (${validPharmacyId})`);

        // 1. Update all medicines
        const medUpdate = await Medicine.updateMany({}, { $set: { pharmacy: validPharmacyId } });
        console.log(`MEDICINES_UPDATED: ${medUpdate.modifiedCount}`);

        // 2. Update all orders
        const orderUpdate = await Order.updateMany(
            { pharmacy: { $ne: validPharmacyId } },
            { $set: { pharmacy: validPharmacyId } }
        );
        console.log(`ORDERS_UPDATED: ${orderUpdate.modifiedCount}`);

        console.log('Database consistency fix completed.');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

run();
