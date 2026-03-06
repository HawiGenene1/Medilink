import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'antd/dist/reset.css';
import 'leaflet/dist/leaflet.css';
import './styles/global.css';

// Critical Map Fix: Removes the "teal/green coat" globally
const style = document.createElement('style');
style.innerHTML = `
  .leaflet-container {
    background-color: var(--bg-main) !important;
  }
  .leaflet-tile-pane {
    filter: none !important;
  }
`;
document.head.appendChild(style);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
