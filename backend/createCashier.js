require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Role = require('./src/models/Role');
const Pharmacy = require('./src/models/Pharmacy');

const createCashier = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medilink');
        console.log('Connected to DB');

        // 1. Get or Create Cashier Role
        let role = await Role.findOne({ name: 'cashier' });
        if (!role) {
            console.log('Creating cashier role...');
            role = await Role.create({
                name: 'cashier',
                permissions: ['view_orders', 'verify_payments', 'process_refunds', 'generate_invoices']
            });
        }

        // 2. Get or Create Pharmacy
        let pharmacy = await Pharmacy.findOne();
        if (!pharmacy) {
            console.log('Creating demo pharmacy...');
            pharmacy = await Pharmacy.create({
                name: 'MediCare Pharmacy',
                ownerName: 'Demo Owner',
                licenseNumber: 'PH-DEMO-001',
                email: 'demo@pharmacy.com',
                phone: '+251911223344',
                location: { type: 'Point', coordinates: [38.74, 9.03] },
                address: {
                    street: '123 Health St',
                    city: 'Addis Ababa',
                    state: 'Addis Ababa',
                    zipCode: '1000',
                    country: 'Ethiopia'
                },
                owner: role._id // Temporary owner just to satisfy schema
            });
        }

        // 3. Create Cashier User
        console.log('Creating cashier user...');
        // Check if exists first
        let cashier = await User.findOne({ email: 'cashier@medilink.com' });
        if (cashier) {
            console.log('Cashier already exists. Updating password...');
            cashier.password = 'Cashier123';
            cashier.role = 'cashier';
            cashier.phone = '+251000000000';
            cashier.pharmacyId = pharmacy._id;
            await cashier.save();
        } else {
            cashier = await User.create({
                firstName: 'Cashier',
                lastName: 'User',
                email: 'cashier@medilink.com',
                password: 'Cashier123',
                phone: '+251000000000',
                username: 'cashier',
                role: 'cashier',
                pharmacyId: pharmacy._id,
                isActive: true,
                status: 'active',
                isEmailVerified: true
            });
        }

        console.log('Cashier User Ready:', cashier.email);
        console.log('Password set to: Cashier123');

    } catch (e) {
        console.error('ERROR CREATING CASHIER:', e);
        const fs = require('fs');
        fs.writeFileSync('cashier_error.log', e.toString() + '\\n' + JSON.stringify(e.errors, null, 2));
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
};

createCashier();
