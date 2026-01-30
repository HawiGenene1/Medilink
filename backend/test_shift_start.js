const axios = require('axios');

async function testStartShift() {
    try {
        // 1. Login
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'cashier@test.com',
            password: 'password123'
        });
        const token = loginRes.data.token;
        console.log('Logged in successfully');

        // 2. Start Shift
        const shiftRes = await axios.post('http://localhost:5000/api/cashier/shift/start',
            { openingCash: 100 },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('Shift Result:', JSON.stringify(shiftRes.data, null, 2));

    } catch (error) {
        console.error('Test Failed:', error.response?.data || error.message);
    }
}

testStartShift();
