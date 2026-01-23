require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const DeliveryProfile = require('../src/models/DeliveryProfile');
const path = require('path');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/medilink';

async function seedApplication() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected!');

        const email = 'test-approval@medilink.com';

        // Cleanup
        await User.deleteOne({ email });
        // Also delete profile if exists (need userId from user normally, but here we just deleted user)
        // We'll search profile by populate or just leave it since userId match is key. 
        // Better:
        // const existingUser = await User.findOne({ email });
        // if (existingUser) await DeliveryProfile.deleteOne({ userId: existingUser._id });

        console.log('Creating pending delivery user...');
        const user = await User.create({
            firstName: 'Pending',
            lastName: 'Driver',
            email,
            password: 'password123',
            phone: '1234567890',
            role: 'delivery',
            status: 'pending',
            isEmailVerified: true
        });

        console.log('Creating delivery profile...');
        const profile = await DeliveryProfile.create({
            userId: user._id,
            currentStep: 9,
            onboardingStatus: 'pending_review',
            submittedAt: new Date(),
            personalDetails: {
                dateOfBirth: new Date('1990-01-01'),
                residentialAddress: {
                    street: '123 Main St',
                    city: 'Cityville',
                    state: 'CA',
                    zipCode: '90210'
                },
                preferredLanguage: 'English',
                emergencyContact: {
                    name: 'Jane Doe',
                    relationship: 'Spouse',
                    phone: '555-555-5555'
                }
            },
            vehicleDetails: {
                type: 'car',
                make: 'Toyota',
                model: 'Camry',
                year: '2020',
                color: 'Silver',
                licensePlate: 'ABC-1234'
            },
            documents: {
                governmentId: 'uploads/mock/id.jpg',
                driversLicense: 'uploads/mock/license.jpg',
                insuranceProof: 'uploads/mock/insurance.jpg'
            },
            backgroundCheck: {
                consented: true,
                consentedAt: new Date(),
                status: 'pending'
            },
            paymentInfo: {
                preference: 'weekly',
                bankName: 'Test Bank',
                accountNumber: '****5678'
            }
        });

        console.log('✅ Seeded pending application!');
        console.log(`User: ${email}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

seedApplication();
