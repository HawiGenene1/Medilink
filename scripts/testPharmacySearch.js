const mongoose = require('mongoose');
const Pharmacy = require('../backend/src/models/Pharmacy');
require('dotenv').config({ path: './backend/.env' });

async function testProximity() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected.');

        // Mexico Square Coordinates
        const mexicoSquare = { lat: 9.0113, lng: 38.7492 };

        console.log(`🔍 Searching for pharmacies near Mexico Square (${mexicoSquare.lat}, ${mexicoSquare.lng})...`);

        const pharmacies = await Pharmacy.find({
            status: 'approved',
            isActive: true,
            location: {
                $nearSphere: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [mexicoSquare.lng, mexicoSquare.lat]
                    },
                    $maxDistance: 5000 // 5km
                }
            }
        }).limit(5);

        console.log(`Found ${pharmacies.length} pharmacies:`);
        pharmacies.forEach((p, i) => {
            console.log(`${i + 1}. ${p.name} - Location: [${p.location.coordinates}]`);
        });

        if (pharmacies.length > 0) {
            console.log('✅ SUCCESS: Proximity search is working.');
        } else {
            console.log('⚠️ WARNING: No pharmacies found near Mexico Square. Ensure pharmacies are seeded and located there.');
        }

    } catch (err) {
        console.error('❌ ERROR:', err);
    } finally {
        await mongoose.disconnect();
    }
}

testProximity();
