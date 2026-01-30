require('dotenv').config();
const jwt = require('jsonwebtoken');
const axios = require('axios');

const simulateRequest = async () => {
    try {
        const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
        const token = jwt.sign({ userId: '65ab1234567890abcdef1234', role: 'cashier' }, secret, { expiresIn: '1h' });

        console.log('Using Token:', token.substring(0, 10) + '...');

        const urls = [
            'http://localhost:5000/api/cashier/stats/today',
            'http://localhost:5000/api/cashier/transactions/recent',
            'http://localhost:5000/api/cashier/alerts'
        ];

        for (const url of urls) {
            try {
                console.log(`Hitting ${url}...`);
                const res = await axios.get(url, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log(`Success ${url}:`, res.status);
            } catch (err) {
                console.log(`Failure ${url}:`, err.response?.status || err.message);
                if (err.response?.data) console.log('Error Data:', JSON.stringify(err.response.data));
            }
        }
    } catch (e) {
        console.error('Simulation failed:', e);
    }
};

simulateRequest();
