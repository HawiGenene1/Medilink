const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/medilink';

const verify = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        const Pharmacy = mongoose.model('Pharmacy', new mongoose.Schema({ name: String }));
        const TempPharmacy = mongoose.model('TempPharmacy', new mongoose.Schema({ status: String }));
        const User = mongoose.model('User', new mongoose.Schema({ role: String }));

        const pCount = await Pharmacy.countDocuments();
        const tCount = await TempPharmacy.countDocuments();
        const uCount = await User.countDocuments({ role: { $ne: 'admin' } });

        console.log(`TEMP_REGISTRATIONS: ${tCount}`);
        console.log(`PHARMACIES: ${pCount}`);
        console.log(`NON_ADMIN_USERS: ${uCount}`);

        if (pCount > 5) {
            console.log('⚠️ Warning: High pharmacy count detected. Possible leftover mock data.');
        } else {
            console.log('✅ Pharmacy count looks clean.');
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

verify();
