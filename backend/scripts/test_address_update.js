const axios = require('axios');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api/v1';

// Replace with a valid order ID and user token during manual run
const ORDER_ID = process.argv[2];
const TOKEN = process.argv[3];

async function testAddressUpdate() {
    if (!ORDER_ID || !TOKEN) {
        console.error('Usage: node test_address_update.js <orderId> <token>');
        process.exit(1);
    }

    try {
        console.log(`Testing address update for Order: ${ORDER_ID}`);

        const response = await axios.patch(`${API_URL}/orders/${ORDER_ID}/address`, {
            coordinates: {
                latitude: 9.011,
                longitude: 38.751
            },
            label: 'Diagnostic Test Location',
            notes: 'Updated via test script'
        }, {
            headers: {
                'Authorization': `Bearer ${TOKEN}`
            }
        });

        console.log('Update Response:', JSON.stringify(response.data, null, 2));

        if (response.data.success) {
            console.log('SUCCESS: Delivery location updated.');
        } else {
            console.log('FAILED: Success flag is false.');
        }

    } catch (error) {
        console.error('ERROR:', error.response ? error.response.data : error.message);
    }
}

testAddressUpdate();
