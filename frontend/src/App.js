// frontend/src/App.js
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider, App as AntApp, theme as antTheme } from 'antd';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { CartProvider } from './contexts/CartContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { UIProvider, useUI } from './contexts/UIContext';
import AppRouter from './routes/AppRouter';

const AppContent = () => {
  const { theme } = useUI();
  const isDark = theme === 'dark';

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
        token: {
          fontFamily: "'Poppins', sans-serif",
          colorPrimary: '#4361ee',
          borderRadius: 8,
          // Only set bg if explicit override is needed, otherwise algorithm handles it
          // colorBgContainer: '#ffffff', 
        },
      }}
    >
      <AntApp>
        <BrowserRouter>
          <AuthProvider>
            <SocketProvider>
              <CartProvider>
                <FavoritesProvider>
                  <NotificationProvider>
                    <AppRouter />
                  </NotificationProvider>
                </FavoritesProvider>
              </CartProvider>
            </SocketProvider>
          </AuthProvider>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  );
};

function App() {
  // Development-only console log
  if (process.env.NODE_ENV === 'development') {
    console.log('Running in development mode');
  }

  return (
    <UIProvider>
      <AppContent />
    </UIProvider>
  );
}

export default App;
