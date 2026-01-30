require('dotenv').config();
const mongoose = require('mongoose');
const dashboardController = require('./src/controllers/cashierDashboardController');
const User = require('./src/models/User');

const testController = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const cashier = await User.findOne({ role: 'cashier' });
        if (!cashier) {
            console.log('No cashier found');
            return;
        }

        const req = {
            user: { userId: cashier._id }
        };
        const res = {
            json: (data) => console.log('Response JSON:', JSON.stringify(data, null, 2)),
            status: (code) => {
                console.log('Response Status:', code);
                return res;
            }
        };

        console.log('Testing getTodayStats...');
        await dashboardController.getTodayStats(req, res);

        console.log('Testing getAlerts...');
        await dashboardController.getAlerts(req, res);

    } catch (e) {
        console.error('Test failed:', e);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
};

testController();
