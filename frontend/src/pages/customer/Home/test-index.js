import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';

const TestDashboard = () => {
  const { user } = useAuth();
  
  console.log('TestDashboard rendering, user:', user);
  
  return (
    <div style={{ 
      padding: '20px', 
      background: '#f0f0f0', 
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>
        Test Dashboard Page
      </h1>
      
      <div style={{ 
        background: '#fff', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h2>Welcome!</h2>
        <p>Hello, {user?.firstName || 'Customer'}!</p>
        <p>This is a minimal test to see if anything renders.</p>
        
        <div style={{ 
          background: '#e6f7ff', 
          padding: '10px', 
          borderRadius: '4px',
          marginTop: '10px'
        }}>
          <strong>Debug Info:</strong><br/>
          User: {JSON.stringify(user, null, 2)}
        </div>
      </div>
      
      <div style={{ 
        background: '#fff', 
        padding: '20px', 
        borderRadius: '8px'
      }}>
        <h3>Test Navigation</h3>
        <button 
          onClick={() => alert('Button clicked!')}
          style={{ 
            padding: '10px 20px', 
            background: '#1890ff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Test Button
        </button>
      </div>
    </div>
  );
};

export default TestDashboard;
