const mongoose = require('mongoose');
const User = require('../src/models/User');
const Pharmacy = require('../src/models/Pharmacy');
const Inventory = require('../src/models/Inventory');
const Medicine = require('../src/models/Medicine');
const Category = require('../src/models/Category');

async function simulateStaffAddition() {
    try {
        await mongoose.connect('mongodb://localhost:27017/medilink');
        console.log('Connected to MongoDB');

        const staff = await User.findOne({ email: 'staff1@medilink.com' });
        if (!staff) throw new Error('Staff user not found');

        const pharmacyId = staff.pharmacyId;
        console.log(`Simulating addition for Pharmacy ID: ${pharmacyId}`);

        // 1. Ensure a category exists
        let category = await Category.findOne({ name: /Antibiotics/i });
        if (!category) {
            category = await Category.create({ name: 'Antibiotics', isActive: true });
        }

        // 2. Create/Find Medicine in Catalog
        let medicine = await Medicine.findOne({ name: 'Amoxicillin', pharmacy: pharmacyId });
        if (!medicine) {
            medicine = await Medicine.create({
                name: 'Amoxicillin',
                brand: 'Amoxil',
                manufacturer: 'GlaxoSmithKline',
                category: category._id,
                type: 'capsule',
                dosageForm: 'Capsule',
                strength: '500mg',
                unit: 'mg',
                packSize: '10s',
                prescriptionRequired: true,
                price: 120,
                quantity: 100, // Required in Medicine schema
                expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Required in Medicine schema
                pharmacy: pharmacyId,
                availableAt: [pharmacyId]
            });
            console.log(`Created new medicine: ${medicine.name}`);
        } else {
            console.log(`Found existing medicine: ${medicine.name}`);
        }

        // 3. Add to Inventory (This is what the staff does)
        const inventoryItem = await Inventory.findOneAndUpdate(
            { pharmacy: pharmacyId, medicine: medicine._id },
            {
                quantity: 250,
                sellingPrice: 125,
                costPrice: 90,
                isActive: true,
                unitType: 'Box',
                batchNumber: 'BN-AMOX-001',
                expiryDate: medicine.expiryDate
            },
            { upsert: true, new: true }
        );

        console.log(`Inventory updated for ${medicine.name}: Quantity ${inventoryItem.quantity}`);

        // 4. Verification: Check if it's visible in the search pipeline
        // The getMedicines logic joins Inventory with Medicine and filters by Approved Pharmacy
        const approvedPharm = await Pharmacy.findOne({ _id: pharmacyId, status: 'approved', isActive: true });
        if (!approvedPharm) {
            console.log('WARNING: Pharmacy is NOT approved or NOT active. Medicine might not show up in customer search.');
        } else {
            console.log(`Pharmacy ${approvedPharm.name} is approved and active.`);
        }

        const items = await Medicine.aggregate([
            { $match: { _id: medicine._id } },
            {
                $lookup: {
                    from: 'inventories',
                    localField: '_id',
                    foreignField: 'medicine',
                    as: 'inventoryItems'
                }
            },
            { $unwind: '$inventoryItems' },
            {
                $match: {
                    'inventoryItems.isActive': true,
                    'inventoryItems.pharmacy': pharmacyId
                }
            }
        ]);

        console.log('\n--- Visibility Check in Aggregation Pipeline ---');
        if (items.length > 0) {
            console.log(`SUCCESS: "${items[0].name}" is visible in the search pipeline.`);
            console.log(`Price: ${items[0].inventoryItems.sellingPrice} ETB, Stock: ${items[0].inventoryItems.quantity}`);
        } else {
            console.log('FAILURE: Medicine is NOT visible in the search pipeline.');
        }

        await mongoose.disconnect();
        console.log('\nSimulation Done.');
    } catch (err) {
        console.error('Error in simulation:', err);
        process.exit(1);
    }
}

simulateStaffAddition();
