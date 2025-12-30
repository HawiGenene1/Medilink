// frontend/src/pages/Home/index.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MedicineBoxOutlined, 
  SafetyOutlined, 
  UserAddOutlined, 
  ClockCircleFilled, 
  TeamOutlined,
  TruckOutlined
} from '@ant-design/icons';
import { Button, Card, Row, Col, Typography, Space, Carousel } from 'antd';
import './Home.css';

const { Title, Text, Paragraph } = Typography;

const Home = () => {
  const navigate = useNavigate();

  const handleCustomerRegister = (e) => {
    e.preventDefault();
    navigate('/auth/register?role=customer');
  };

  const handlePharmacyLogin = (e) => {
    e.preventDefault();
    navigate('/auth/login?role=pharmacy');
  };

  const handlePharmacyRegister = (e) => {
    e.preventDefault();
    navigate('/auth/register?role=pharmacy');
  };

  const features = [
    {
      icon: <MedicineBoxOutlined className="feature-icon" />,
      title: 'Wide Range of Medicines',
      description: 'Access to a comprehensive collection of prescription and over-the-counter medications.'
    },
    {
      icon: <ClockCircleFilled className="feature-icon" />,
      title: '24/7 Availability',
      description: 'Order your medicines anytime, anywhere with our round-the-clock service.'
    },
    {
      icon: <SafetyOutlined className="feature-icon" />,
      title: '100% Authentic',
      description: 'Guaranteed genuine medicines sourced directly from verified manufacturers.'
    },
    {
      icon: <TruckOutlined className="feature-icon" />,
      title: 'Fast Delivery',
      description: 'Quick and reliable delivery right to your doorstep.'
    }
  ];

  const testimonials = [
    {
      quote: "This platform has made managing my prescriptions so much easier. Highly recommended!",
      author: "Alem T.",
      role: "Satisfied Customer"
    },
    {
      quote: "As a pharmacy owner, this platform has helped me reach more customers efficiently.",
      author: "Yohannes M.",
      role: "Pharmacy Owner"
    },
    {
      quote: "The delivery is always on time, and the customer service is excellent.",
      author: "Selam W.",
      role: "Regular User"
    }
  ];

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <Row gutter={[48, 24]} align="middle">
            <Col xs={24} md={12}>
              <div className="hero-content">
                <Text className="hero-badge">#1 Online Pharmacy in Ethiopia</Text>
                <Title level={1} className="hero-title">
                  Your Health, <span className="highlight">Our Priority</span>
                </Title>
                <Title level={4} className="hero-subtitle">
                  Ethiopia's Leading Online Pharmacy & Healthcare Platform
                </Title>
                <Paragraph className="hero-description">
                  Get authentic medicines, expert consultations, and fast delivery - all from the comfort of your home. 
                  Join thousands of satisfied customers who trust us with their healthcare needs.
                </Paragraph>
                <Space size="large" className="hero-buttons">
                  <Button 
                    type="primary" 
                    size="large" 
                    icon={<MedicineBoxOutlined />}
                    onClick={() => navigate('/medicines')}
                    className="btn-primary"
                  >
                    Browse Medicines
                  </Button>
                  <Button 
                    size="large" 
                    icon={<UserAddOutlined />}
                    onClick={handleCustomerRegister}
                    className="btn-secondary"
                  >
                    Sign Up Free
                  </Button>
                </Space>
                <div className="hero-stats">
                  <div className="stat-item">
                    <TeamOutlined className="stat-icon" />
                    <div>
                      <div className="stat-number">10,000+</div>
                      <div className="stat-label">Happy Customers</div>
                    </div>
                  </div>
                  <div className="stat-item">
                    <MedicineBoxOutlined className="stat-icon" />
                    <div>
                      <div className="stat-number">5,000+</div>
                      <div className="stat-label">Medicines</div>
                    </div>
                  </div>
                </div>
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div className="hero-image-container">
                <img 
                  src="https://img.freepik.com/free-vector/online-doctor-concept-illustration_114360-1830.jpg" 
                  alt="Healthcare professionals" 
                  className="hero-image"
                />
              </div>
            </Col>
          </Row>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <Title level={2} className="section-title">Why Choose MediLink?</Title>
          <Row gutter={[24, 24]}>
            {features.map((feature, index) => (
              <Col xs={24} sm={12} lg={6} key={index}>
                <Card className="feature-card" hoverable>
                  <div className="feature-icon-container">
                    {feature.icon}
                  </div>
                  <Title level={4} className="feature-title">{feature.title}</Title>
                  <Paragraph className="feature-description">{feature.description}</Paragraph>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="container">
          <Title level={2} className="section-title">What Our Users Say</Title>
          <Carousel autoplay>
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-slide">
                <div className="testimonial-content">
                  <blockquote>"{testimonial.quote}"</blockquote>
                  <div className="testimonial-author">
                    <strong>{testimonial.author}</strong>
                    <span>{testimonial.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </Carousel>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <Card className="cta-card">
            <Row align="middle" gutter={[24, 24]}>
              <Col xs={24} md={16}>
                <Title level={3} className="cta-title">Ready to get started?</Title>
                <Paragraph className="cta-description">
                  Join thousands of satisfied customers and pharmacies using MediLink today.
                </Paragraph>
              </Col>
              <Col xs={24} md={8} className="cta-buttons">
                <Button 
                  type="primary" 
                  size="large" 
                  onClick={handleCustomerRegister}
                  className="btn-primary"
                >
                  Get Started
                </Button>
                <Button 
                  type="default" 
                  size="large" 
                  onClick={handlePharmacyRegister}
                  className="btn-outline"
                >
                  For Pharmacies
                </Button>
              </Col>
            </Row>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Home;