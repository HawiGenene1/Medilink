// Test frontend API connection
const testFrontendAPI = async () => {
  try {
    console.log('🔍 Testing frontend API connection...');
    
    // Test the same API call that frontend makes
    const API_URL = 'http://localhost:5000/api';
    
    const response = await fetch(`${API_URL}/auth/login`, {
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
      console.log('✅ Frontend API connection working!');
    } else {
      console.log('❌ Frontend API connection failed');
      console.log('📝 Error message:', data.message);
    }
    
  } catch (error) {
    console.error('❌ Error testing frontend API:', error.message);
  }
};

testFrontendAPI();
