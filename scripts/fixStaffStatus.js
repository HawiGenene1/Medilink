const mongoose = require('mongoose');
const User = require('../backend/src/models/User');
require('dotenv').config({ path: './backend/.env' });

async function fixStatus() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected.');

        const rolesToFix = ['staff', 'cashier', 'pharmacy_staff', 'admin', 'system_admin', 'pharmacy_admin', 'pharmacy_owner', 'pharmacist', 'technician', 'assistant'];

        console.log(`🔍 Searching for users with roles [${rolesToFix.join(', ')}] in 'pending' status...`);

        const result = await User.updateMany(
            {
                role: { $in: rolesToFix },
                status: 'pending'
            },
            {
                $set: { status: 'active', isActive: true }
            }
        );

        console.log(`✅ SUCCESS: Updated ${result.modifiedCount} users to 'active' status.`);

    } catch (err) {
        console.error('❌ ERROR:', err);
    } finally {
        await mongoose.disconnect();
    }
}

fixStatus();
