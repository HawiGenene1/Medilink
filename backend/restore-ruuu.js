const mongoose = require('mongoose');
const User = require('./src/models/User');
const DeliveryProfile = require('./src/models/DeliveryProfile');
const bcrypt = require('bcryptjs');

const restore = async () => {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect('mongodb://localhost:27017/medilink');
        console.log('Connected to DB');

        const email = 'dependent.tarsier.uxmj@protectsmail.net';

        // 1. Create User
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('Test123456', salt);

        const user = new User({
            firstName: 'ruuu',
            lastName: 'ruuu',
            email: email,
            password: hashedPassword,
            phone: '+251900000000',
            role: 'delivery',
            status: 'active',
            isActive: true,
            isEmailVerified: true
        });

        await user.save();
        console.log('User ruuu created (Status: active)');

        // 2. Create Delivery Profile
        const profile = new DeliveryProfile({
            userId: user._id,
            onboardingStatus: 'approved',
            currentStep: 8,
            vehicleDetails: {
                type: 'motorcycle',
                make: 'Yamaha',
                model: 'FZs',
                year: '2023',
                color: 'Black',
                licensePlate: 'AA-2-12345'
            },
            submittedAt: new Date(),
            reviewedAt: new Date()
        });

        await profile.save();
        console.log('Delivery Profile created (Status: approved)');

        process.exit();
    } catch (error) {
        console.error('Error during restore:', error);
        process.exit(1);
    }
};

restore();
