const mongoose = require('mongoose');
const User = require('./src/models/User');
const DeliveryProfile = require('./src/models/DeliveryProfile');

const fixUser = async () => {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect('mongodb://localhost:27017/medilink');
        console.log('Connected to DB');

        // 1. Fix "ruuu"
        const searchName = 'ruuu';
        const users = await User.find({
            $or: [
                { firstName: { $regex: searchName, $options: 'i' } },
                { lastName: { $regex: searchName, $options: 'i' } }
            ]
        });

        console.log(`Found ${users.length} users matching "${searchName}"`);
        for (const user of users) {
            console.log(`Fixing user: ${user.firstName} ${user.lastName} (${user._id})`);
            user.role = 'delivery';
            user.status = 'pending';
            // check if field is corrupted
            await user.save();
            console.log('-> Fixed role and status');

            // Ensure profile exists
            let profile = await DeliveryProfile.findOne({ userId: user._id });
            if (!profile) {
                profile = new DeliveryProfile({ userId: user._id, onboardingStatus: 'pending_review' });
                await profile.save();
                console.log('-> Created missing DeliveryProfile');
            } else {
                profile.onboardingStatus = 'pending_review'; // Ensure it's visible
                await profile.save();
                console.log('-> Updated DeliveryProfile status');
            }
        }

        // 2. List all Pending Delivery Users (to find mock data)
        console.log('\n--- ALL PENDING DELIVERY USERS ---');
        const pending = await User.find({ role: 'delivery', status: 'pending' });
        pending.forEach(u => {
            console.log(`- ${u.firstName} ${u.lastName} (${u.email})`);
        });

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

fixUser();
