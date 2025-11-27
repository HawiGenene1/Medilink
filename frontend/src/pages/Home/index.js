import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingOutlined, MedicineBoxOutlined, SafetyOutlined, RocketOutlined } from '@ant-design/icons';
import './Home.css';

const Home = () => {
  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              Your Health, <span className="highlight">Our Priority</span>
            </h1>
            <p className="hero-subtitle">
              Ethiopia's Leading Online Pharmacy & Healthcare Platform
            </p>
            <p className="hero-description">
              Get authentic medicines, expert consultations, and fast delivery - all from the comfort of your home. 
              Join thousands of satisfied customers who trust us with their healthcare needs.
            </p>
            <div className="cta-buttons">
              <Link to="/register" className="btn btn-primary">
                <RocketOutlined /> Get Started for Free
              </Link>
              <Link to="/login" className="btn btn-outline">
                Sign In
              </Link>
            </div>
            <div className="hero-trust">
              <div className="trust-item">
                <SafetyOutlined className="trust-icon" />
                <span>100% Genuine Medicines</span>
              </div>
              <div className="trust-item">
                <MedicineBoxOutlined className="trust-icon" />
                <span>Free Delivery</span>
              </div>
              <div className="trust-item">
                <ShoppingOutlined className="trust-icon" />
                <span>Easy Returns</span>
              </div>
            </div>
          </div>
          <div className="hero-image">
            <div className="floating-card">
              <MedicineBoxOutlined className="hero-icon" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">Why Choose MediLink?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <ShoppingOutlined />
              </div>
              <h3>Easy Online Ordering</h3>
              <p>Browse and order medicines from verified pharmacies with just a few clicks</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <MedicineBoxOutlined />
              </div>
              <h3>Verified Medicines</h3>
              <p>All medicines are sourced from licensed pharmacies and verified suppliers</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <SafetyOutlined />
              </div>
              <h3>Secure & Safe</h3>
              <p>Your health data and transactions are protected with industry-standard security</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <RocketOutlined />
              </div>
              <h3>Fast Delivery</h3>
              <p>Quick and reliable delivery service to get your medicines when you need them</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <h2>Ready to Get Started?</h2>
          <p>Join thousands of users managing their health with MediLink</p>
          <Link to="/register" className="btn btn-primary btn-large">
            Create Your Account
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
