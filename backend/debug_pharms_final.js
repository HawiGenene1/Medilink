const mongoose = require('mongoose');
const fs = require('fs');
const Pharmacy = require('./src/models/Pharmacy');
const Subscription = require('./src/models/Subscription');
const Inventory = require('./src/models/Inventory');

async function debug() {
    let output = '';
    const log = (msg) => { output += msg + '\n'; };

    try {
        await mongoose.connect('mongodb://localhost:27017/medilink');
        log('Connected to MongoDB');

        const names = ['Kenema Pharmacy', 'HawiPharmacy', 'HealthPlus Pharmacy', 'MediCare Pharmacy'];
        for (const name of names) {
            log(`\n=== Checking: ${name} ===`);
            const p = await Pharmacy.findOne({ name: name });
            if (!p) {
                log('Pharmacy not found');
                continue;
            }
            log(`ID: ${p._id}`);
            log(`Status: ${p.status}`);
            log(`IsActive: ${p.isActive}`);
            log(`Verified: ${p.isVerified}`);

            const sub = await Subscription.findOne({ pharmacy: p._id });
            if (sub) {
                log(`Subscription Status: ${sub.status}`);
                log(`Subscription End: ${sub.endDate}`);
                log(`Is Current: ${sub.endDate > new Date()}`);
            } else {
                log('No Subscription found');
            }

            const invCount = await Inventory.countDocuments({ pharmacy: p._id });
            log(`Inventory Items: ${invCount}`);
        }

        fs.writeFileSync('pharm_debug_output.txt', output);
        await mongoose.disconnect();
    } catch (err) {
        fs.writeFileSync('pharm_debug_output.txt', err.toString());
        process.exit(1);
    }
}

debug();
