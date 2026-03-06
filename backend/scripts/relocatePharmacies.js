require('dotenv').config();
const mongoose = require('mongoose');
const Pharmacy = require('../src/models/Pharmacy');

// Mexico Square, Addis Ababa approx coordinates
// Latitude: 9.0113, Longitude: 38.7492
const MEXICO_CENTER = {
    lat: 9.0113,
    lng: 38.7492
};

const relocatePharmacies = async () => {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medilink');
        console.log('✅ Connected.\n');

        const pharmacies = await Pharmacy.find({});
        console.log(`Found ${pharmacies.length} pharmacies to update.`);

        for (let i = 0; i < pharmacies.length; i++) {
            const pharmacy = pharmacies[i];

            // Add small random variation to separate them slightly (within ~500m)
            const variation = (Math.random() - 0.5) * 0.005;
            const newLng = MEXICO_CENTER.lng + variation;
            const newLat = MEXICO_CENTER.lat + variation;

            pharmacy.location = {
                type: 'Point',
                coordinates: [newLng, newLat]
            };

            // Update address text as well for consistency
            pharmacy.address.street = "Mexico Square Area";
            pharmacy.address.city = "Addis Ababa";

            await pharmacy.save();
            console.log(`📍 Relocated '${pharmacy.name}' to [${newLng.toFixed(4)}, ${newLat.toFixed(4)}]`);
        }

        console.log('\n✅ All pharmacies relocated to Mexico Square area.');

    } catch (error) {
        console.error('❌ Error relocating pharmacies:', error);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
};

relocatePharmacies();
