const mongoose = require('mongoose');
const User = require('./backend/src/models/User');
const Inventory = require('./backend/src/models/Inventory');
const Pharmacy = require('./backend/src/models/Pharmacy');
const PharmacyStaff = require('./backend/src/models/PharmacyStaff');

async function audit() {
    await mongoose.connect('mongodb://localhost:27017/medilink');
    console.log('--- DATABASE AUDIT ---');

    const stableId = '65a7d5c9f1a2b3c4d5e6f701';

    // 1. Check Pharmacy
    const pharmacy = await Pharmacy.findById(stableId);
    console.log(`Stable Pharmacy Exists: ${!!pharmacy}`);
    if (pharmacy) console.log(`Pharmacy Name: ${pharmacy.name}`);

    // 2. Check Users
    const users = await User.find({ role: { $in: ['PHARMACY_OWNER', 'staff'] } });
    console.log(`\nFound ${users.length} pharmacy-related users:`);
    for (const u of users) {
        console.log(`- ${u.email} [${u.role}] | PharmacyID: ${u.pharmacyId}`);
        if (u.role === 'staff') {
            const staff = await PharmacyStaff.findOne({ user: u._id });
            console.log(`  Staff Record Pharmacy: ${staff?.pharmacy}`);
        }
    }

    // 3. Check Inventory
    const allInv = await Inventory.find().populate('medicine', 'name');
    console.log(`\nFound ${allInv.length} total inventory records:`);
    for (const inv of allInv) {
        console.log(`- ${inv.medicine?.name || 'Unknown'} | Branch: ${inv.pharmacy} | Qty: ${inv.quantity}`);
        if (inv.pharmacy.toString() === stableId) {
            console.log('  -> MATCHES STABLE ID');
        } else {
            console.log('  -> MISMATCH');
        }
    }

    await mongoose.disconnect();
}

audit();
