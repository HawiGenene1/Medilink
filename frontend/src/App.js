// frontend/src/App.js
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
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
      <AntApp>
        <BrowserRouter>
          <AuthProvider>
            <CartProvider>
              <FavoritesProvider>
                <AppRouter />
              </FavoritesProvider>
            </CartProvider>
          </AuthProvider>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  );
}

export default App;