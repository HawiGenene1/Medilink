// frontend/src/layouts/AuthLayout.js
import React from 'react';
import { Outlet } from 'react-router-dom';
import './AuthLayout.css'; // For any specific auth layout styles

const AuthLayout = () => {
  return <Outlet />;
};

export default AuthLayout;
