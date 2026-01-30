const mongoose = require('mongoose');
const User = require('./src/models/User');
const DeliveryProfile = require('./src/models/DeliveryProfile');

const debugUser = async () => {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect('mongodb://localhost:27017/medilink');
        console.log('Connected to DB');

        const searchName = 'ruuu';
        // Case insensitive search for firstName or lastName
        const users = await User.find({
            $or: [
                { firstName: { $regex: searchName, $options: 'i' } },
                { lastName: { $regex: searchName, $options: 'i' } }
            ]
        });

        console.log(`Found ${users.length} users matching "${searchName}"`);

        for (const user of users) {
            console.log('------------------------------------------------');
            console.log('User ID:', user._id);
            console.log('Name:', user.firstName, user.lastName);
            console.log('Email:', user.email);
            console.log('Role:', user.role);
            console.log('Status:', user.status);

            const profile = await DeliveryProfile.findOne({ userId: user._id });
            console.log('Delivery Profile:', profile ? 'EXISTS' : 'MISSING');
            if (profile) {
                console.log('  Onboarding Status:', profile.onboardingStatus);
                console.log('  Current Step:', profile.currentStep);
                console.log('  Submission Date:', profile.submittedAt);
            } else {
                console.log('  No DeliveryProfile found for this user.');
            }
        }

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

debugUser();
