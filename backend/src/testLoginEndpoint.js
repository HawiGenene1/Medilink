require('dotenv').config();

const testLoginEndpoint = async () => {
  try {
    console.log('🔍 Testing login endpoint...');
    
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'cashier@medilink.com',
        password: 'Cashier123'
      })
    });

    const data = await response.json();
    
    console.log('📊 Response status:', response.status);
    console.log('📄 Response data:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.success) {
      console.log('✅ Login endpoint working!');
      console.log('🎫 Token generated:', !!data.token);
      console.log('👤 User data:', !!data.user);
    } else {
      console.log('❌ Login endpoint failed');
      console.log('📝 Error message:', data.message);
    }
    
  } catch (error) {
    console.error('❌ Error testing endpoint:', error.message);
  }
};

testLoginEndpoint();
