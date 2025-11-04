import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRouter from './routes/AppRouter';
import './styles/global.css';

function App() {
  return (
    <Router>
      <div className="app">
        <AppRouter />
      </div>
    </Router>
  );
}

export default App;