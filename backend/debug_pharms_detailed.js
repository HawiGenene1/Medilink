const mongoose = require('mongoose');
const Pharmacy = require('./src/models/Pharmacy');
const Subscription = require('./src/models/Subscription');
const Inventory = require('./src/models/Inventory');

async function debug() {
    try {
        await mongoose.connect('mongodb://localhost:27017/medilink');
        console.log('Connected to MongoDB');

        const names = ['Kenema Pharmacy', 'HawiPharmacy', 'HealthPlus Pharmacy', 'MediCare Pharmacy'];
        for (const name of names) {
            console.log(`\n=== Checking: ${name} ===`);
            const p = await Pharmacy.findOne({ name: name });
            if (!p) {
                console.log('Pharmacy not found');
                continue;
            }
            console.log(`ID: ${p._id}`);
            console.log(`Status: ${p.status}`);
            console.log(`IsActive: ${p.isActive}`);
            console.log(`Verified: ${p.isVerified}`);

            const sub = await Subscription.findOne({ pharmacy: p._id });
            if (sub) {
                console.log(`Subscription Status: ${sub.status}`);
                console.log(`Subscription End: ${sub.endDate}`);
                console.log(`Is Current: ${sub.endDate > new Date()}`);
            } else {
                console.log('No Subscription found');
            }

            const invCount = await Inventory.countDocuments({ pharmacy: p._id });
            console.log(`Inventory Items: ${invCount}`);
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debug();
