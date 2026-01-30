const mongoose = require('mongoose');
const User = require('./src/models/User');
const DeliveryProfile = require('./src/models/DeliveryProfile');
const PendingPharmacy = require('./src/models/PendingPharmacy');
const Pharmacy = require('./src/models/Pharmacy');

const cleanup = async () => {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect('mongodb://localhost:27017/medilink');
        console.log('Connected to DB');

        // 1. Delete "ruuu" and variants
        console.log('Cleaning up test users...');
        const testUserPatterns = ['ruuu', 'Johnny', 'Sam', 'Simple Sam', 'test', 'User 0'];
        const usersToDelete = await User.find({
            $or: [
                { firstName: { $regex: testUserPatterns.join('|'), $options: 'i' } },
                { lastName: { $regex: testUserPatterns.join('|'), $options: 'i' } },
                { email: { $regex: 'test|example|ruuu', $options: 'i' } }
            ]
        });

        console.log(`Found ${usersToDelete.length} candidates for deletion.`);

        for (const user of usersToDelete) {
            // Keep the standard seed users if they match (John Pharmacy, Jane Customer)
            if (user.email === 'admin@medilink.com' || user.email === 'pharmacy@medilink.com' || user.email === 'customer@medilink.com') {
                console.log(`Skipping core seed user: ${user.email}`);
                continue;
            }

            console.log(`Deleting user: ${user.firstName} ${user.lastName} (${user.email})`);
            await DeliveryProfile.deleteMany({ userId: user._id });
            await PendingPharmacy.deleteMany({ userId: user._id });
            // Note: If they own a pharmacy, we might need to delete that too, but usually mock users don't.
            await User.deleteOne({ _id: user._id });
        }

        // 2. Clear any lingering PendingPharmacy or DeliveryProfile that doesn't have a user
        console.log('Cleaning up orphaned profiles...');
        const allUsers = await User.find({}, '_id');
        const userIds = allUsers.map(u => u._id);

        const orphanedProfiles = await DeliveryProfile.deleteMany({ userId: { $nin: userIds } });
        console.log(`Deleted ${orphanedProfiles.deletedCount} orphaned delivery profiles.`);

        const orphanedPending = await PendingPharmacy.deleteMany({ userId: { $nin: userIds } });
        console.log(`Deleted ${orphanedPending.deletedCount} orphaned pending pharmacy records.`);

        console.log('\n--- CURRENT CLEAN USER LIST ---');
        const remaining = await User.find({});
        remaining.forEach(u => {
            console.log(`- ${u.firstName} ${u.lastName} (${u.email}) [${u.role}] [${u.status}]`);
        });

        process.exit();
    } catch (error) {
        console.error('Error during cleanup:', error);
        process.exit(1);
    }
};

cleanup();
