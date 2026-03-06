const mongoose = require('mongoose');
const Pharmacy = require('./src/models/Pharmacy');
const Subscription = require('./src/models/Subscription');
const Inventory = require('./src/models/Inventory');

async function debug() {
    try {
        await mongoose.connect('mongodb://localhost:27017/medilink');
        console.log('Connected to MongoDB');

        const pharms = await Pharmacy.find({
            name: { $in: ['Kenema Pharmacy', 'HawiPharmacy', 'HealthPlus Pharmacy', 'MediCare Pharmacy'] }
        });
        console.log('--- Pharmacies ---');
        pharms.forEach(p => {
            console.log(`Name: ${p.name}`);
            console.log(`ID: ${p._id}`);
            console.log(`Status: ${p.status}`);
            console.log(`IsActive: ${p.isActive}`);
            console.log('-----------------');
        });

        const pharmIds = pharms.map(p => p._id);
        const subs = await Subscription.find({ pharmacy: { $in: pharmIds } });
        console.log('--- Subscriptions ---');
        subs.forEach(s => {
            console.log(`Pharmacy ID: ${s.pharmacy}`);
            console.log(`Status: ${s.status}`);
            console.log(`End Date: ${s.endDate}`);
            console.log('-----------------');
        });

        const invCount = await Inventory.countDocuments({ pharmacy: { $in: pharmIds } });
        console.log(`Total Inventory Count for these pharms: ${invCount}`);

        const invSamples = await Inventory.find({ pharmacy: { $in: pharmIds } }).limit(5).populate('medicine');
        console.log('--- Inventory Samples ---');
        invSamples.forEach(i => {
            console.log(`Pharmacy: ${i.pharmacy}`);
            console.log(`Medicine: ${i.medicine?.name}`);
            console.log(`Quantity: ${i.quantity}`);
            console.log(`IsActive: ${i.isActive}`);
            console.log('-----------------');
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debug();
