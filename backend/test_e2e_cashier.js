const axios = require('axios');

const testE2E = async () => {
    try {
        const baseUrl = 'http://localhost:5000/api';
        console.log('Logging in...');
        const loginRes = await axios.post(`${baseUrl}/auth/login`, {
            email: 'cashier@medilink.com',
            password: 'password123' // Standard test password
        });

        const token = loginRes.data.token;
        console.log('Login Success. Token acquired.');

        const endpoints = [
            '/cashier/stats/today',
            '/cashier/transactions/recent',
            '/cashier/alerts'
        ];

        for (const ep of endpoints) {
            try {
                process.stdout.write(`Fetching ${ep}... `);
                const res = await axios.get(`${baseUrl}${ep}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log(`OK (${res.status})`);
            } catch (err) {
                console.log(`FAIL (${err.response?.status || err.message})`);
                if (err.response?.data) console.log('   Error:', JSON.stringify(err.response.data));
            }
        }

    } catch (e) {
        console.error('E2E Test failed during login:', e.response?.status || e.message);
        if (e.response?.data) console.log('   Error:', JSON.stringify(e.response.data));
    }
};

testE2E();
