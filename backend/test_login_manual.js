const axios = require('axios');

async function testLogin() {
    try {
        const response = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'cashier@test.com',
            password: 'password123'
        });
        console.log('Login Success:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Login Failed:', error.response?.data || error.message);
    }
}

testLogin();
