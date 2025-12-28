// frontend/src/App.js
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AppRouter from './routes/AppRouter';

function App() {
  // Development-only console log
  if (process.env.NODE_ENV === 'development') {
    console.log('Running in development mode');
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        {process.env.NODE_ENV === 'development' && (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              background: '#ffeb3b',
              color: '#000',
              padding: '4px',
              textAlign: 'center',
              zIndex: 9999,
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            DEVELOPMENT MODE - Using mock authentication
          </div>
        )}
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;