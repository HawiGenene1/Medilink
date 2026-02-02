const mongoose = require('mongoose');
require('dotenv').config();
const Pharmacy = require('./src/models/Pharmacy');
const Subscription = require('./src/models/Subscription');
const SubscriptionHistory = require('./src/models/SubscriptionHistory');
const User = require('./src/models/User');

async function testAssign() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const pharmacy = await Pharmacy.findOne({ name: /Pharmacy 145/i });
        if (!pharmacy) {
            console.log('Pharmacy not found');
            return;
        }
        console.log('Found Pharmacy:', pharmacy.name, pharmacy._id);

        const admin = await User.findOne({ role: 'pharmacy_admin' });
        if (!admin) {
            console.log('Admin user not found');
            return;
        }

        const plan = 'premium';
        const durationMonths = 1;
        const pharmacyId = pharmacy._id;

        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + parseInt(durationMonths));

        const planDetails = {
            basic: { maxStaff: 1, features: ['inventory', 'orders'] },
            standard: { maxStaff: 3, features: ['inventory', 'orders', 'reports', 'staff'] },
            premium: { maxStaff: 10, features: ['inventory', 'orders', 'reports', 'staff', 'analytics', 'priority_support'] }
        };

        const details = planDetails[plan] || planDetails.basic;

        const subscription = new Subscription({
            pharmacy: pharmacyId,
            plan,
            mode: 'annually', // Hardcoded to test
            status: 'active',
            startDate,
            endDate,
            isActive: true,
            maxStaff: details.maxStaff,
            features: details.features,
            price: 1200
        });

        try {
            await subscription.save();
            console.log('Subscription saved successfully');
        } catch (saveErr) {
            console.error('Subscription save failed:', saveErr.message);
            if (saveErr.errors) {
                Object.keys(saveErr.errors).forEach(key => {
                    console.error(`Field ${key}: ${saveErr.errors[key].message}`);
                });
            }
            return;
        }

        try {
            pharmacy.subscription = subscription._id;
            await pharmacy.save();
            console.log('Pharmacy updated successfully');
        } catch (pharmacyErr) {
            console.error('Pharmacy update failed:', pharmacyErr.message);
            if (pharmacyErr.errors) {
                Object.keys(pharmacyErr.errors).forEach(key => {
                    console.error(`Field ${key}: ${pharmacyErr.errors[key].message}`);
                });
            }
            return;
        }

        try {
            await SubscriptionHistory.create({
                subscription: subscription._id,
                pharmacy: pharmacyId,
                action: 'assigned',
                details: `Assigned ${plan} plan (${durationMonths} months)`,
                performedBy: admin._id
            });
            console.log('History logged successfully');
        } catch (historyErr) {
            console.error('History log failed:', historyErr.message);
            return;
        }

        console.log('Full assignment cycle completed successfully');

    } catch (err) {
        console.error('Overall error:', err.message);
    } finally {
        await mongoose.disconnect();
    }
}

testAssign();
