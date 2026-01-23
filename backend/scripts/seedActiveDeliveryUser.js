require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const DeliveryProfile = require('../src/models/DeliveryProfile');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/medilink';

async function seedActiveDeliveryUser() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected!');

        const email = 'active-delivery@medilink.com';
        const password = 'password123';

        // Cleanup existing
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            await DeliveryProfile.deleteOne({ userId: existingUser._id });
            await User.deleteOne({ _id: existingUser._id });
        }

        console.log('Creating active delivery user...');
        const user = await User.create({
            firstName: 'Active',
            lastName: 'Rider',
            email,
            password: password,
            phone: '9876543210',
            role: 'delivery',
            status: 'active', // Important: Active status
            isEmailVerified: true
        });

        console.log('Creating delivery profile...');
        await DeliveryProfile.create({
            userId: user._id,
            currentStep: 9,
            onboardingStatus: 'approved', // Important: Approved
            submittedAt: new Date(),
            reviewedAt: new Date(),
            personalDetails: {
                dateOfBirth: new Date('1992-05-15'),
                residentialAddress: {
                    street: '456 Fast Lane',
                    city: 'Speed City',
                    state: 'CA',
                    zipCode: '90001'
                },
                preferredLanguage: 'English',
                emergencyContact: {
                    name: 'Speedy Contact',
                    relationship: 'Peer',
                    phone: '555-999-8888'
                }
            },
            vehicleDetails: {
                type: 'motorcycle',
                make: 'Yamaha',
                model: 'R3',
                year: '2021',
                color: 'Blue',
                licensePlate: 'FAST-22'
            },
            documents: {
                governmentId: 'uploads/mock/id.jpg',
                driversLicense: 'uploads/mock/license.jpg',
                insuranceProof: 'uploads/mock/insurance.jpg'
            },
            backgroundCheck: {
                consented: true,
                status: 'completed'
            },
            paymentInfo: {
                preference: 'instant',
                bankName: 'Fast Bank',
                accountNumber: '****9999'
            }
        });

        console.log('✅ Active Delivery User created!');
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

seedActiveDeliveryUser();
