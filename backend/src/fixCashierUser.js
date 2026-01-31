require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
const User = require('./models/User');
const Pharmacy = require('./models/Pharmacy');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/medilink';

const fixCashierUser = async () => {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // 1. Find a valid Pharmacy
        console.log('🔍 Finding a pharmacy to associate with cashier...');
        let pharmacy = await Pharmacy.findOne({ name: 'MediCare Pharmacy' });

        if (!pharmacy) {
            console.log('⚠️ MediCare Pharmacy not found. Looking for ANY pharmacy...');
            pharmacy = await Pharmacy.findOne({});
        }

        if (!pharmacy) {
            console.log('⚠️ No pharmacies found. Creating a dummy pharmacy...');
            pharmacy = new Pharmacy({
                name: 'MediLink Default Pharmacy',
                licenseNumber: 'PH-DEFAULT-' + Date.now(),
                email: 'default@medilink.com',
                phone: '+251900000000',
                address: {
                    street: 'Default St',
                    city: 'Addis Ababa',
                    state: 'Addis Ababa',
                    zipCode: '1000',
                    country: 'Ethiopia'
                },
                location: {
                    type: 'Point',
                    coordinates: [38.7469, 9.0320]
                },
                status: 'active',
                isActive: true,
                isVerified: true
            });
            await pharmacy.save();
            console.log('✅ Created dummy pharmacy');
        }

        console.log(`✅ Using pharmacy: ${pharmacy.name} (${pharmacy._id})`);

        // 2. Remove existing incorrect cashier user/role if any
        await User.deleteOne({ email: 'cashier@medilink.com' });
        console.log('🗑️  Removed any existing cashier@medilink.com user');

        // 3. Create correct cashier user
        console.log('➕ Creating correct cashier user...');

        const cashier = new User({
            firstName: 'Cashier',
            lastName: 'User',
            email: 'cashier@medilink.com',
            password: 'Cashier123', // Will be hashed by pre-save hook
            phone: '+251999999999',
            role: 'cashier', // Correct String Enum
            pharmacyId: pharmacy._id, // Required for cashier
            status: 'active', // Required for login
            isActive: true,
            isEmailVerified: true,
            address: {
                street: 'Cashier Lane',
                city: 'Addis Ababa',
                state: 'Addis Ababa',
                zipCode: '1000',
                country: 'Ethiopia'
            }
        });

        await cashier.save();

        console.log('✅ Cashier user created successfully');
        console.log('📧 Email: cashier@medilink.com');
        console.log('🔑 Password: Cashier123');
        console.log('🏥 Pharmacy: ' + pharmacy.name);
        console.log('🎭 Role: cashier');
        console.log('🟢 Status: active');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        process.exit(0);
    }
};

fixCashierUser();
