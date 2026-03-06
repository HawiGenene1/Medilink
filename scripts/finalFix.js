const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function verify() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);

        const roles = ['staff', 'cashier', 'pharmacy_staff', 'admin', 'system_admin', 'pharmacy_admin', 'pharmacy_owner', 'pharmacist', 'technician', 'assistant'];

        console.log('🛠️ Applying final fix to pending internal roles...');
        const fixResult = await mongoose.connection.db.collection('users').updateMany(
            { role: { $in: roles }, status: 'pending' },
            { $set: { status: 'active', isActive: true } }
        );
        console.log(`✅ Updated ${fixResult.modifiedCount} users.`);

        console.log('📋 Current PENDING users:');
        const pending = await mongoose.connection.db.collection('users').find({ status: 'pending' }).toArray();
        if (pending.length === 0) {
            console.log('No pending users found.');
        } else {
            pending.forEach(u => console.log(`${u.email} | ${u.role} | ${u.status}`));
        }

    } catch (err) {
        console.error('❌ ERROR:', err);
    } finally {
        await mongoose.disconnect();
    }
}
verify();
