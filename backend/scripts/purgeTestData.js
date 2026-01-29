const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/medilink';

const purgeData = async () => {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected.\n');

        // Import models (standard CJS)
        const Pharmacy = mongoose.model('Pharmacy', new mongoose.Schema({ name: String, owner: mongoose.Schema.Types.ObjectId }));
        const User = mongoose.model('User', new mongoose.Schema({ email: String }));
        const TempPharmacy = mongoose.model('TempPharmacy', new mongoose.Schema({ pharmacyName: String }));
        const Subscription = mongoose.model('Subscription', new mongoose.Schema({ pharmacy: mongoose.Schema.Types.ObjectId }));
        const SubscriptionHistory = mongoose.model('SubscriptionHistory', new mongoose.Schema({ pharmacy: mongoose.Schema.Types.ObjectId }));

        console.log('🧹 Identifying test data...');

        // 1. Find Test Users
        const testUserEmails = ['test_owner@medilink.com', 'pharmacy@medilink.com'];
        const testUsers = await User.find({ email: { $in: testUserEmails } });
        const testUserIds = testUsers.map(u => u._id);
        console.log(`Found ${testUserIds.length} test users.`);

        // 2. Find Test Pharmacies
        // Matches "Pharmacy 1", "Pharmacy 147", "Test Verification Pharmacy", "MediCare Pharmacy", "HealthPlus Pharmacy"
        const testPharmacies = await Pharmacy.find({
            $or: [
                { name: /^Pharmacy \d+/ },
                { name: /Test/i },
                { name: /MediCare/i },
                { name: /HealthPlus/i }
            ]
        });
        const testPharmacyIds = testPharmacies.map(p => p._id);
        console.log(`Found ${testPharmacyIds.length} test pharmacies.`);

        // 3. Purge Subscriptions linked to these pharmacies
        const subResult = await Subscription.deleteMany({ pharmacy: { $in: testPharmacyIds } });
        const historyResult = await SubscriptionHistory.deleteMany({ pharmacy: { $in: testPharmacyIds } });
        console.log(`Deleted ${subResult.deletedCount} subscriptions and ${historyResult.deletedCount} history records.`);

        // 4. Purge Pharmacies
        const pharmResult = await Pharmacy.deleteMany({ _id: { $in: testPharmacyIds } });
        console.log(`Deleted ${pharmResult.deletedCount} pharmacies.`);

        // 5. Purge Users
        const userResult = await User.deleteMany({ _id: { $in: testUserIds } });
        console.log(`Deleted ${userResult.deletedCount} test users.`);

        // 6. Clear all Temp Registrations
        const tempResult = await TempPharmacy.deleteMany({});
        console.log(`Cleared ${tempResult.deletedCount} registration requests.`);

        console.log('\n✨ Database Sanitization Complete.');

    } catch (error) {
        console.error('❌ Error during purge:', error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

purgeData();
