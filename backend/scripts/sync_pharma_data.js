const mongoose = require('mongoose');
const Pharmacy = require('./src/models/Pharmacy');
const Subscription = require('./src/models/Subscription');
const Medicine = require('./src/models/Medicine');
const Inventory = require('./src/models/Inventory');

async function fixData() {
    try {
        await mongoose.connect('mongodb://localhost:27017/medilink');
        console.log('Connected to MongoDB');

        const names = ['Kenema Pharmacy', 'HawiPharmacy', 'HealthPlus Pharmacy', 'MediCare Pharmacy'];

        for (const name of names) {
            console.log(`\nProcessing: ${name}`);

            // 1. Approve Pharmacy
            let p = await Pharmacy.findOne({ name });
            if (!p) {
                console.log(`  - Pharmacy not found`);
                continue;
            }

            p.status = 'approved';
            p.isActive = true;
            p.isVerified = true;
            await p.save();
            console.log(`  - Set status to approved, isActive: true`);

            // 2. Ensure Subscription
            let sub = await Subscription.findOne({ pharmacy: p._id });
            if (!sub) {
                sub = new Subscription({
                    pharmacy: p._id,
                    plan: 'premium',
                    status: 'active',
                    startDate: new Date(),
                    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
                    price: 299,
                    features: ['inventory', 'analytics', 'priority_support']
                });
                await sub.save();
                console.log(`  - Created new active subscription`);
            } else {
                sub.status = 'active';
                sub.endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
                await sub.save();
                console.log(`  - Updated existing subscription to active`);
            }

            // 3. Create missing Inventory records
            const medicines = await Medicine.find({ pharmacy: p._id });
            console.log(`  - Found ${medicines.length} medicines owned by this pharmacy`);

            for (const med of medicines) {
                let inv = await Inventory.findOne({ pharmacy: p._id, medicine: med._id });
                if (!inv) {
                    inv = new Inventory({
                        pharmacy: p._id,
                        medicine: med._id,
                        quantity: 50, // Default for testing
                        reorderLevel: 10,
                        sellingPrice: med.price || 150,
                        costPrice: (med.price || 150) * 0.7,
                        isActive: true,
                        unitType: 'Piece'
                    });
                    await inv.save();
                    console.log(`    - Created inventory for: ${med.name}`);
                } else {
                    inv.isActive = true;
                    if (inv.quantity === 0) inv.quantity = 50;
                    await inv.save();
                    console.log(`    - Updated existing inventory for: ${med.name}`);
                }

                // Ensure medicine also reflects availability
                if (!med.availableAt.includes(p._id)) {
                    med.availableAt.push(p._id);
                    await med.save();
                }
            }
        }

        console.log('\nData synchronization complete!');
        await mongoose.disconnect();
    } catch (err) {
        console.error('Error fixing data:', err);
        process.exit(1);
    }
}

fixData();
