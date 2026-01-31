// frontend/src/layouts/AuthLayout.js
import React from 'react';
import { Outlet } from 'react-router-dom';
import './AuthLayout.css'; // For any specific auth layout styles

const AuthLayout = () => {
  return (
    <div className="auth-layout">
      <div className="auth-container">
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
