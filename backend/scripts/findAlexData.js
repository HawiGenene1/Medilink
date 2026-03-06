const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../src/models/User');
const DeliveryProfile = require('../src/models/DeliveryProfile');

async function findAlex() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const fs = require('fs');
        const results = { users: [], profiles: [] };

        const users = await User.find({ firstName: /alex/i }).lean();
        results.users = users;

        for (const user of users) {
            console.log(`User ${user.firstName} vehicleInfo:`, user.vehicleInfo);
            const profile = await DeliveryProfile.findOne({ userId: user._id }).lean();
            results.profiles.push(profile);
        }

        fs.writeFileSync('alex_data.json', JSON.stringify(results, null, 2));
        console.log('Results written to alex_data.json');
    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
}

findAlex();
