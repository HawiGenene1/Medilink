import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button, Drawer, Dropdown, Menu, Space, Avatar } from 'antd';
import { MenuOutlined, UserOutlined, MedicineBoxOutlined } from '@ant-design/icons';
import { useAuth } from '../../../contexts/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getDashboardLink = () => {
    if (!user) return '/auth/login';
    switch (user.role) {
      case 'admin': return '/admin/dashboard';
      case 'delivery': return '/delivery/dashboard';
      case 'pharmacy_admin': return '/pharmacy-admin/dashboard';
      case 'pharmacy_staff': return '/pharmacy-staff/inventory';
      case 'cashier': return '/cashier/dashboard';
      case 'customer': return '/customer/dashboard';
      default: return '/customer/dashboard';
    }
  };

  const getProfileLink = () => {
    if (!user) return '/auth/login';
    switch (user.role) {
      case 'admin': return '/admin/settings';
      case 'delivery': return '/delivery/profile';
      case 'customer': return '/customer/profile';
      default: return getDashboardLink(); // Fallback to their dashboard if no profile page exists
    }
  };

  const userMenuItems = [
    {
      key: 'dashboard',
      label: (
        <Link to={getDashboardLink()}>
          Dashboard
        </Link>
      )
    },
    {
      key: 'profile',
      label: <Link to={getProfileLink()}>Profile</Link>
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      label: 'Logout',
      danger: true,
      onClick: logout
    }
  ];

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="container navbar-content">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <MedicineBoxOutlined className="logo-icon" />
          <span className="logo-text">MediLink</span>
        </Link>

        {/* Desktop Links */}
        <div className="navbar-links desktop-only">
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Home</Link>
          <Link to="/medicines" className={location.pathname === '/medicines' ? 'active' : ''}>Medicines</Link>
          <Link to="/pharmacies" className={location.pathname === '/pharmacies' ? 'active' : ''}>Nearby Pharmacies</Link>
          <Link to="/about">About Us</Link>
        </div>

        {/* Actions */}
        <div className="navbar-actions desktop-only">
          {user ? (
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space className="user-dropdown" style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} src={user.avatar} style={{ backgroundColor: '#4361ee' }} />
                <span style={{ fontWeight: 500 }}>{user.firstName}</span>
              </Space>
            </Dropdown>
          ) : (
            <>
              <Link to="/auth/login">
                <Button type="text" className="btn-link">  Sign in </Button>
              </Link>
              <Link to="/auth/register">
                <Button type="primary" className="btn-signup">Get Started</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <Button
          className="mobile-toggle"
          type="text"
          icon={<MenuOutlined />}
          onClick={() => setMobileMenuOpen(true)}
        />

        {/* Mobile Drawer */}
        <Drawer
          title="Menu"
          placement="right"
          onClose={() => setMobileMenuOpen(false)}
          visible={mobileMenuOpen}
        >
          <div className="mobile-links">
            <Link to="/" onClick={() => setMobileMenuOpen(false)}>Home</Link>
            <Link to="/medicines" onClick={() => setMobileMenuOpen(false)}>Medicines</Link>
            <Link to="/pharmacies" onClick={() => setMobileMenuOpen(false)}>Nearby Pharmacies</Link>
            <Link to="/about" onClick={() => setMobileMenuOpen(false)}>About Us</Link>

            <div className="mobile-actions">
              {user ? (
                <Button block onClick={logout} danger>Logout</Button>
              ) : (
                <>
                  <Link to="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button block>Sign In</Button>
                  </Link>
                  <Link to="/auth/register?role=customer" onClick={() => setMobileMenuOpen(false)}>
                    <Button type="primary" block>Sign Up</Button>
                  </Link>
                  <Link to="/auth/register?role=pharmacy" onClick={() => setMobileMenuOpen(false)}>
                    <Button block style={{ marginTop: '8px' }}>For Pharmacies</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </Drawer>
      </div>
    </nav>
  );
};

export default Navbar;