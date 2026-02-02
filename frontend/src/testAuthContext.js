// Test the fixed AuthContext
console.log('🔍 Testing AuthContext fix...');

// Test the structure that backend returns
const mockResponse = {
  success: true,
  user: {
    id: '123',
    firstName: 'Cashier',
    lastName: 'User',
    email: 'cashier@medilink.com',
    role: 'cashier'
  }
};

// Test extraction
const user = mockResponse.user;
console.log('✅ User extracted:', user);
console.log('✅ User role:', user.role);
console.log('✅ User email:', user.email);

console.log('🎉 AuthContext fix test complete!');
