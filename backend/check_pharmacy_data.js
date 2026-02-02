const mongoose = require('mongoose');
require('dotenv').config();
const Pharmacy = require('./src/models/Pharmacy');

async function checkPharmacy() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const pharmacy = await Pharmacy.findOne({ name: /Pharmacy 145/i });
        if (pharmacy) {
            console.log('Pharmacy Name:', pharmacy.name);
            console.log('Pharmacy Status:', pharmacy.status);
            console.log('Full Pharmacy Object:', JSON.stringify(pharmacy, null, 2));
        } else {
            console.log('Pharmacy not found');
        }
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkPharmacy();
