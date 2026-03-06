const mongoose = require('mongoose');
const fs = require('fs');
const Medicine = require('./src/models/Medicine');
const Pharmacy = require('./src/models/Pharmacy');

async function debug() {
    try {
        await mongoose.connect('mongodb://localhost:27017/medilink');
        const report = await Medicine.aggregate([
            {
                $group: {
                    _id: '$pharmacy',
                    count: { $sum: 1 },
                    names: { $push: '$name' }
                }
            },
            {
                $lookup: {
                    from: 'pharmacies',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'pharmacy'
                }
            },
            { $unwind: '$pharmacy' },
            {
                $project: {
                    pharmacyName: '$pharmacy.name',
                    medicineCount: '$count',
                    sampleMedicines: { $slice: ['$names', 5] }
                }
            }
        ]);

        fs.writeFileSync('medicine_ownership_report.json', JSON.stringify(report, null, 2));
        await mongoose.disconnect();
    } catch (err) {
        fs.writeFileSync('medicine_ownership_report.json', err.toString());
        process.exit(1);
    }
}

debug();
