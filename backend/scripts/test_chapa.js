const axios = require('axios');
require('dotenv').config();

async function testChapa() {
    const secretKey = process.env.CHAPA_SECRET_KEY;
    const baseURL = 'https://api.chapa.co/v1';

    console.log('Using Secret Key:', secretKey ? `${secretKey.substring(0, 15)}...` : 'MISSING');

    const txRef = `DEV-TEST-${Date.now()}`;
    const payload = {
        amount: '100',
        currency: 'ETB',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        tx_ref: txRef,
        callback_url: 'https://webhook.site/test',
        return_url: 'http://localhost:3000/success'
    };

    try {
        console.log('Initializing test payment...');
        const response = await axios.post(
            `${baseURL}/transaction/initialize`,
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${secretKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('Chapa Response Status:', response.data.status);
        console.log('Chapa Response Message:', response.data.message);
        console.log('Chapa Data:', JSON.stringify(response.data.data, null, 2));
    } catch (error) {
        console.error('Chapa Test Error Status:', error.response?.status);
        console.error('Chapa Test Error Data:', JSON.stringify(error.response?.data, null, 2));
        console.error('Error Message:', error.message);
    }
}

testChapa();
