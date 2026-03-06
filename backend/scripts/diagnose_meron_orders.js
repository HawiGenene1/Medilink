const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const run = async () => {
    try {
        const API_URL = 'http://localhost:5000/api/v1';

        // 1. Login as Meron
        // Assuming we know the email from previous search
        const email = 'staff2@medilink.com';
        console.log(`Searching for user: ${email}...`);
        const User = require('../src/models/User');
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOne({ email });

        if (!user) {
            console.error('Meron not found');
            process.exit(1);
        }

        console.log(`Found Meron: ${user._id} | Role: ${user.role} | Pharmacy: ${user.pharmacyId}`);

        const jwt = require('jsonwebtoken');
        const token = jwt.sign({
            userId: user._id,
            id: user._id,
            role: user.role,
            pharmacyId: user.pharmacyId
        }, process.env.JWT_SECRET);

        console.log('Generated Token');

        // 2. Call the orders API
        console.log('Calling /cashier/orders?status=all');
        const response = await axios.get(`${API_URL}/cashier/orders?status=all`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Response Success:', response.data.success);
        console.log('Orders Count:', response.data.data.length);
        if (response.data.data.length > 0) {
            console.log('First Order Pharmacy:', response.data.data[0].pharmacy);
        }

        process.exit(0);
    } catch (err) {
        console.error('Error:', err.response ? err.response.data : err.message);
        process.exit(1);
    }
};

run();
