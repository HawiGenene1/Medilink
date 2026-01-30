const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const User = mongoose.model('User', require('./src/models/User').schema);
    const DeliveryProfile = mongoose.model('DeliveryProfile', require('./src/models/DeliveryProfile').schema);

    // Find driver user
    const driver = await User.findOne({ role: 'delivery' });

    if (!driver) {
        console.log('No driver found in database');
        process.exit(1);
    }

    console.log('=== DRIVER INFO ===');
    console.log('ID:', driver._id);
    console.log('Email:', driver.email);
    console.log('Name:', driver.firstName, driver.lastName);
    console.log('Status:', driver.status);

    // Check DeliveryProfile
    const profile = await DeliveryProfile.findOne({ userId: driver._id });

    console.log('\n=== DELIVERY PROFILE ===');
    if (profile) {
        console.log('Profile exists:', true);
        console.log('Onboarding Status:', profile.onboardingStatus);
        console.log('Is Available:', profile.isAvailable);
        console.log('Current Location:', profile.currentLocation);
    } else {
        console.log('Profile exists:', false);
        console.log('⚠️  No DeliveryProfile found for this driver!');
    }

    process.exit(0);
}).catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
