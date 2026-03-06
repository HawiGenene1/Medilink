const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const mongoose = require('mongoose');

async function testLiveServer() {
    try {
        await mongoose.connect('mongodb://localhost:27017/medilink');
        require('../src/models/User');
        const User = mongoose.model('User');
        const user = await User.findOne({ email: 'cranchychoco@gmail.com' });

        if (!user) throw new Error('User cranchychoco@gmail.com not found');

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

        console.log('Testing live server initialization...');
        const res = await axios.post('http://localhost:5000/api/v1/payments/chapa/initialize', {
            orderId: '698ab86223c30fbd04807844',
            paymentMethod: 'telebirr',
            phoneNumber: '0911234567',
            returnUrl: 'http://localhost:3000/success'
        }, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('SERVER RESPONSE:', JSON.stringify(res.data, null, 2));
    } catch (error) {
        if (error.response) {
            console.log('SERVER ERROR:', error.response.status, JSON.stringify(error.response.data, null, 2));
        } else {
            console.log('ERROR:', error.message);
        }
    } finally {
        await mongoose.disconnect();
    }
}

testLiveServer();
