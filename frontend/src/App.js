// frontend/src/App.js
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import AppRouter from './routes/AppRouter';

function App() {
  // Development-only console log
  if (process.env.NODE_ENV === 'development') {
    console.log('Running in development mode');
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          fontFamily: "'Poppins', sans-serif",
          colorPrimary: '#4361ee',
          borderRadius: 8,
          colorBgContainer: '#ffffff',
        },
      }}
    >
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <FavoritesProvider>
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
            </FavoritesProvider>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;