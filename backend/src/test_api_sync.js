const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const STABLE_PHARMACY_ID = '65a7d5c9f1a2b3c4d5e6f701';

// Function to create a mock token
const createMockToken = (email, role) => {
    const payload = btoa(JSON.stringify({ email, role }));
    return `header.${payload}.signature`;
};

async function testSync() {
    const ownerToken = createMockToken('pharmacy@medilink.com', 'PHARMACY_OWNER');
    const staffToken = createMockToken('staff@medilink.com', 'staff');

    try {
        console.log('--- TESTING OWNER SIDE ---');
        const ownerRes = await axios.get(`${BASE_URL}/inventory`, {
            headers: { Authorization: `Bearer ${ownerToken}` }
        });
        console.log(`Owner sees ${ownerRes.data.count} items.`);
        if (ownerRes.data.count > 0) {
            console.log('Sample item:', ownerRes.data.data[0].medicine?.name);
        }

        console.log('\n--- TESTING STAFF SIDE ---');
        const staffRes = await axios.get(`${BASE_URL}/inventory`, {
            headers: { Authorization: `Bearer ${staffToken}` }
        });
        console.log(`Staff sees ${staffRes.data.count} items.`);
        if (staffRes.data.count > 0) {
            console.log('Sample item:', staffRes.data.data[0].medicine?.name);
        }

    } catch (err) {
        console.error('API Test failed:', err.response?.data || err.message);
    }
}

testSync();
