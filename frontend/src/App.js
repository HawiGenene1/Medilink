import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AppRouter from './routes/AppRouter';
import './styles/global.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="app">
          <AppRouter />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;