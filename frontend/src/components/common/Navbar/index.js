import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  MedicineBoxOutlined, 
  ShopOutlined, 
  FileTextOutlined, 
  PhoneOutlined,
  FileSearchOutlined 
} from '@ant-design/icons';
import { useAuth } from '../../../contexts/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    { path: '/medicines', icon: <MedicineBoxOutlined />, label: 'Medicines' },
    { path: '/pharmacies', icon: <ShopOutlined />, label: 'Pharmacies' },
    { path: '/prescriptions', icon: <FileTextOutlined />, label: 'My Prescriptions' },
    { path: '/contact', icon: <PhoneOutlined />, label: 'Contact' }
  ];

  // Add Review Prescriptions for pharmacy staff
  if (user && ['pharmacy_staff', 'pharmacy_admin', 'admin'].includes(user.role)) {
    navItems.splice(2, 0, { 
      path: '/prescriptions/review', 
      icon: <FileSearchOutlined />, 
      label: 'Review Prescriptions' 
    });
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/" className="logo">
            <span className="logo-text">Medi</span>
            <span className="logo-highlight">Link</span>
          </Link>
        </div>
        <div className="navbar-links">
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              to={item.path} 
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;