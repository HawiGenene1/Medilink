const mongoose = require('mongoose');
const Pharmacy = require('../src/models/Pharmacy');
const Subscription = require('../src/models/Subscription');
const Inventory = require('../src/models/Inventory');
const Medicine = require('../src/models/Medicine');

const targetPharmacies = [
    'Kenema Pharmacy',
    'HawiPharmacy',
    'HealthPlus Pharmacy',
    'MediCare Pharmacy'
];

async function fixPharmacies() {
    try {
        await mongoose.connect('mongodb://localhost:27017/medilink');
        console.log('Connected to MongoDB');

        for (const name of targetPharmacies) {
            console.log(`\nProcessing: ${name}`);

            // 1. Approve Pharmacy
            const pharmacy = await Pharmacy.findOneAndUpdate(
                { name: name },
                {
                    status: 'approved',
                    isActive: true,
                    isVerified: true
                },
                { new: true, upsert: false }
            );

            if (!pharmacy) {
                console.log(`  - Pharmacy not found skipping.`);
                continue;
            }
            console.log(`  - Status set to APPROVED/ACTIVE (ID: ${pharmacy._id})`);

            // 2. Ensure Active Subscription
            let sub = await Subscription.findOne({ pharmacy: pharmacy._id });
            const oneYearFromNow = new Date();
            oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

            if (sub) {
                sub.status = 'active';
                sub.isActive = true;
                sub.endDate = oneYearFromNow;
                await sub.save();
                console.log('  - Existing subscription updated to ACTIVE');
            } else {
                await Subscription.create({
                    pharmacy: pharmacy._id,
                    plan: 'premium',
                    mode: 'annually',
                    price: 4999,
                    startDate: new Date(),
                    endDate: oneYearFromNow,
                    status: 'active',
                    isActive: true,
                    payment: {
                        status: 'completed',
                        method: 'cash',
                        paidDate: new Date()
                    }
                });
                console.log('  - New premium subscription created');
            }

            // 3. Create Inventory for existing medicines
            const medicines = await Medicine.find({ pharmacy: pharmacy._id });
            console.log(`  - Found ${medicines.length} medicines owned by this pharmacy`);

            for (const med of medicines) {
                const existingInv = await Inventory.findOne({
                    pharmacy: pharmacy._id,
                    medicine: med._id
                });

                if (!existingInv) {
                    await Inventory.create({
                        pharmacy: pharmacy._id,
                        medicine: med._id,
                        quantity: 100, // Default for testing
                        reorderLevel: 10,
                        sellingPrice: med.price || 50,
                        costPrice: (med.price || 50) * 0.7,
                        isActive: true,
                        unitType: 'Box'
                    });
                    console.log(`    * Created inventory for: ${med.name}`);
                } else {
                    existingInv.isActive = true;
                    if (existingInv.quantity === 0) existingInv.quantity = 100;
                    await existingInv.save();
                    console.log(`    * Updated existing inventory for: ${med.name}`);
                }

                // Ensure medicine knows it's available at this pharmacy
                if (!med.availableAt.includes(pharmacy._id)) {
                    med.availableAt.push(pharmacy._id);
                    await med.save();
                }
            }
        }

        console.log('\nFinalizing changes...');
        await mongoose.disconnect();
        console.log('Done.');
    } catch (err) {
        console.error('Error in fix script:', err);
        process.exit(1);
    }
}

fixPharmacies();
