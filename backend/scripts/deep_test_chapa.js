const axios = require('axios');
require('dotenv').config();

async function deepTestChapa() {
    const secretKey = process.env.CHAPA_SECRET_KEY;
    const baseURL = 'https://api.chapa.co/v1';

    console.log('--- Diagnosis Start ---');
    console.log('Secret Key (start):', secretKey?.substring(0, 15));
    console.log('Secret Key (end):', secretKey?.substring(secretKey.length - 10));
    console.log('Key Length:', secretKey?.length);

    const testEndpoints = [
        { name: 'Banks List (GET)', url: `${baseURL}/banks`, method: 'GET' },
        {
            name: 'Initialize (POST)',
            url: `${baseURL}/transaction/initialize`,
            method: 'POST',
            data: {
                amount: '100',
                currency: 'ETB',
                email: 'test@example.com',
                first_name: 'Test',
                last_name: 'User',
                tx_ref: `TEST-${Date.now()}`,
                callback_url: 'https://webhook.site/test',
                return_url: 'https://google.com'
            }
        }
    ];

    for (const test of testEndpoints) {
        console.log(`\nTesting: ${test.name}`);
        try {
            const config = {
                headers: {
                    'Authorization': `Bearer ${secretKey}`,
                    'Content-Type': 'application/json'
                }
            };

            let response;
            if (test.method === 'GET') {
                response = await axios.get(test.url, config);
            } else {
                response = await axios.post(test.url, test.data, config);
            }

            console.log(`[${test.name}] Success! Status:`, response.data.status);
        } catch (error) {
            console.error(`[${test.name}] Failed.`);
            console.error('Status Code:', error.response?.status);
            console.error('Response Data:', JSON.stringify(error.response?.data, null, 2));
        }
    }
}

deepTestChapa();
