const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Pharmacy = require('../src/models/Pharmacy');
const Subscription = require('../src/models/Subscription');
const User = require('../src/models/User'); // Import User model

dotenv.config({ path: '../.env' });

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/medilink');
        console.log('Connected to MongoDB...');

        // 1. Create a Dummy Owner User
        let owner = await User.findOne({ email: 'test_owner@medilink.com' });
        if (!owner) {
            owner = await User.create({
                firstName: 'Test',
                lastName: 'Owner',
                email: 'test_owner@medilink.com',
                password: 'password123', // Dummy password
                role: 'customer',
                phone: '0911000000'
            });
            console.log('Created Test Owner:', owner.email);
        }

        // 2. Create or Find a Test Pharmacy
        let pharmacy = await Pharmacy.findOne({ email: 'test_pharmacy@medilink.com' });

        if (!pharmacy) {
            pharmacy = await Pharmacy.create({
                name: 'Test Verification Pharmacy',
                email: 'test_pharmacy@medilink.com',
                phone: '0911223344',
                address: { // Fixed: Address Object
                    street: 'Bole Road',
                    city: 'Addis Ababa',
                    state: 'Addis Ababa',
                    zipCode: '1000',
                    country: 'Ethiopia'
                },
                licenseNumber: 'LIC-TEST-2024',
                ownerName: 'Test Owner',
                owner: owner._id, // Fixed: Added Owner Reference
                status: 'approved',
                isActive: true,
                location: {
                    type: 'Point',
                    coordinates: [38.7578, 8.9806] // Addis Ababa Bole
                }
            });
            console.log('Created Test Pharmacy:', pharmacy.name);
        } else {
            console.log('Found Existing Pharmacy:', pharmacy.name);
        }

        // 3. Assign Subscription
        let sub = await Subscription.findOne({ pharmacy: pharmacy._id });

        if (sub) {
            console.log('Pharmacy already has a subscription. Updating to Active...');
            sub.status = 'active';
            sub.isActive = true;
            sub.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // +30 days
            await sub.save();
        } else {
            console.log('Creating new subscription...');
            const subData = {
                pharmacy: pharmacy._id,
                plan: 'standard',
                mode: 'annually',
                startDate: new Date(),
                endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // +1 year
                price: 500,
                status: 'active',
                isActive: true, // Ensure it is active
                payment: { status: 'completed' },
                features: ['Inventory', 'Orders', 'Staff Mgmt', 'Basic Reports'],
                maxStaff: 3
            };
            console.log('Payload:', JSON.stringify(subData, null, 2));

            sub = await Subscription.create(subData);
            console.log('Assigned Standard Plan Subscription:', sub._id);
        }

        // Update pharmacy reference
        if (sub) {
            pharmacy.subscription = sub._id;
            await pharmacy.save();
            console.log('Linked Subscription to Pharmacy');
        } else {
            throw new Error('Failed to create subscription');
        }

        console.log('✅ Success! Test Data Generated.');
        process.exit();
    } catch (error) {
        console.error('Error seeding data:');
        if (error.errors) {
            Object.keys(error.errors).forEach(key => {
                console.error(`- ${key}: ${error.errors[key].message}`);
            });
        } else {
            console.error(error);
        }
        process.exit(1);
    }
};

seedData();
