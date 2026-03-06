const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../src/models/User');
const DeliveryProfile = require('../src/models/DeliveryProfile');

async function resetAlexProfile() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const user = await User.findOne({ firstName: /alex/i });
        if (!user) {
            console.log('User Alex not found');
            return;
        }

        const profile = await DeliveryProfile.findOne({ userId: user._id });
        if (!profile) {
            console.log('Profile for Alex not found');
            return;
        }

        // Reset to Step 2 (Vehicle selection) to allow re-entry of correct data
        profile.currentStep = 2;
        profile.onboardingStatus = 'in_progress';
        profile.vehicleDetails = {}; // Clear the false info
        profile.documents = {
            vehiclePhotos: []
        };
        profile.inspection = {
            status: 'not_required',
            inspectionPhotos: []
        };
        profile.submittedAt = undefined;

        await profile.save();
        console.log('Reset profile for Alex to Step 2. Cleared false info.');

    } catch (error) {
        console.error('Error resetting Alex profile:', error);
    } finally {
        await mongoose.disconnect();
    }
}

resetAlexProfile();
