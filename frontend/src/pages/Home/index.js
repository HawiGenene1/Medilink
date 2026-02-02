import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SearchOutlined,
  ShoppingOutlined,
  CarOutlined,
  ShopOutlined,
  BarChartOutlined,
  MedicineBoxOutlined,
  UserAddOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import { Button, Row, Col, Typography, Card, Space, Tag } from 'antd';
import './Home.css';
import './Home_Animations.css';

const { Title, Text, Paragraph } = Typography;

const Home = () => {
  const navigate = useNavigate();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="home-page fade-in">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <Row gutter={[48, 48]} align="middle">
            <Col xs={24} lg={12}>
              <div className="hero-content">
                <Tag color="blue" className="hero-tag">#1 Healthcare Platform in Ethiopia</Tag>
                <Title level={1} className="hero-title">
                  All-in-One <br />
                  <span className="text-gradient">Pharmacy Platform</span>
                </Title>
                <Paragraph className="hero-subtitle">
                  Bridging the gap between patients and pharmacies. Order authentic medicines online or manage your pharmacy inventory with ease.
                </Paragraph>
                <Space size="middle" wrap className="hero-actions">
                  <Button
                    type="primary"
                    size="large"
                    icon={<ShoppingOutlined />}
                    onClick={() => navigate('/auth/register?role=customer')}
                    className="btn-hero-primary"
                  >
                    Start Shopping
                  </Button>
                  <Button
                    size="large"
                    icon={<ShopOutlined />}
                    onClick={() => navigate('/auth/owner/register')}
                    className="btn-hero-secondary"
                  >
                    For Pharmacies
                  </Button>
                </Space>

                <div className="hero-stats">
                  <div>
                    <Title level={3} style={{ marginBottom: 0 }}>500+</Title>
                    <Text type="secondary">Nearby Pharmacies</Text>
                  </div>
                  <div className="divider-vertical"></div>
                  <div>
                    <Title level={3} style={{ marginBottom: 0 }}>10k+</Title>
                    <Text type="secondary">Medicines</Text>
                  </div>
                  <div className="divider-vertical"></div>
                  <div>
                    <Title level={3} style={{ marginBottom: 0 }}>24/7</Title>
                    <Text type="secondary">Support</Text>
                  </div>
                </div>
              </div>
            </Col>
            <Col xs={24} lg={12}>
              {/* 3D Medical Illustration with Floating Animation */}
              <div className="hero-image-wrapper">
                <div className="blob-bg"></div>
                <img
                  src={require('../../assets/hero-pharmacy-3d.png')}
                  alt="Digital Pharmacy Platform"
                  className="hero-image floating-animate"
                />

                {/* Floating Elements for "Live" Effect */}
                <div className="floating-badge badge-top-right">
                  <MedicineBoxOutlined style={{ fontSize: '20px', color: '#4361ee' }} />
                  <Text strong>Fast Delivery</Text>
                </div>

                <div className="floating-badge badge-bottom-left">
                  <BarChartOutlined style={{ fontSize: '20px', color: '#56AB2F' }} />
                  <Text strong>Seamless Tracking</Text>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </section>

      {/* For Patients Section */}
      <section className="segment-section bg-white">
        <div className="container">
          <div className="section-header text-center">
            <Tag color="#56AB2F" style={{ marginBottom: '16px' }}>FOR PATIENTS</Tag>
            <Title level={2}>Your Health, Simplified</Title>
            <Paragraph className="section-desc">
              Get your prescriptions delivered to your doorstep in 3 simple steps.
            </Paragraph>
          </div>

          <Row gutter={[32, 32]}>
            <Col xs={24} md={8}>
              <Card className="feature-card" hoverable>
                <div className="icon-circle text-blue">
                  <SearchOutlined />
                </div>
                <Title level={4}>1. Find Medicines</Title>
                <Text type="secondary">
                  Search for prescription and OTC medicines from verified pharmacies near you.
                </Text>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card className="feature-card" hoverable>
                <div className="icon-circle text-blue">
                  <ShoppingOutlined />
                </div>
                <Title level={4}>2. Place Order</Title>
                <Text type="secondary">
                  Upload your prescription securely and checkout with preferred payment options.
                </Text>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card className="feature-card" hoverable>
                <div className="icon-circle text-blue">
                  <CarOutlined />
                </div>
                <Title level={4}>3. Fast Delivery</Title>
                <Text type="secondary">
                  Track your delivery in real-time and get it safely delivered to your home.
                </Text>
              </Card>
            </Col>
          </Row>

          <div style={{ textAlign: 'center', marginTop: '48px' }}>
            <Button type="primary" size="large" onClick={() => navigate('/auth/register?role=customer')}>
              Join as a Customer <ArrowRightOutlined />
            </Button>
          </div>
        </div>
      </section>



      {/* For Pharmacies Section */}
      <section className="segment-section bg-gray">
        <div className="container">
          <Row gutter={[48, 48]} align="middle" className="reverse-mobile">
            <Col xs={24} lg={12}>
              <div className="image-stack">
                <img
                  src={require('../../assets/pharmacy-dashboard-3d.png')}
                  alt="Pharmacist Dashboard"
                  className="rounded-image shadow-lg hover-scale"
                />
              </div>
            </Col>

            <Col xs={24} lg={12}>
              <Tag color="#4361ee" style={{ marginBottom: '16px' }}>FOR PHARMACIES</Tag>
              <Title level={2}>Grow Your Business Digitaly</Title>
              <Paragraph className="section-desc" style={{ textAlign: 'left', marginBottom: '32px' }}>
                Medilink provides a powerful dashboard to manage your entire pharmacy operation.
              </Paragraph>

              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div className="feature-row">
                  <ShopOutlined className="feature-icon-small" />
                  <div>
                    <Title level={5}>Inventory Management</Title>
                    <Text type="secondary">Track stock levels, expiration dates, and get low-stock alerts.</Text>
                  </div>
                </div>
                <div className="feature-row">
                  <BarChartOutlined className="feature-icon-small" />
                  <div>
                    <Title level={5}>Sales Analytics</Title>
                    <Text type="secondary">Visual reports on daily sales, top products, and revenue growth.</Text>
                  </div>
                </div>
                <div className="feature-row">
                  <UserAddOutlined className="feature-icon-small" />
                  <div>
                    <Title level={5}>Expand Reach</Title>
                    <Text type="secondary">Connect with thousands of new customers online.</Text>
                  </div>
                </div>
              </Space>

              <Button type="primary" size="large" style={{ marginTop: '40px' }} onClick={() => navigate('/auth/owner/register')}>
                Get Your Pharmacy Online
              </Button>
            </Col>
          </Row>
        </div>
      </section>

      {/* For Delivery Partners Section */}
      <section className="segment-section bg-white">
        <div className="container">
          <Row gutter={[48, 48]} align="middle">
            <Col xs={24} lg={12}>
              <Tag color="#1E88E5" style={{ marginBottom: '16px' }}>FOR DELIVERY PARTNERS</Tag>
              <Title level={2}>Earn by Delivering Health</Title>
              <Paragraph className="section-desc" style={{ textAlign: 'left', marginBottom: '32px' }}>
                Join our clinical logistics network. Enjoy flexible hours, competitive pay, and the satisfaction of helping your community.
              </Paragraph>

              <Row gutter={[16, 24]}>
                <Col span={12}>
                  <Card bordered={false} className="mini-feature">
                    <CarOutlined style={{ fontSize: '24px', color: '#1E88E5' }} />
                    <Title level={5}>Flexible Hours</Title>
                    <Text type="secondary">Be your own boss and work when you want.</Text>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card bordered={false} className="mini-feature">
                    <BarChartOutlined style={{ fontSize: '24px', color: '#1E88E5' }} />
                    <Title level={5}>Weekly Payouts</Title>
                    <Text type="secondary">Get paid regularly for your completed deliveries.</Text>
                  </Card>
                </Col>
                <Col span={24}>
                  <Button
                    type="primary"
                    size="large"
                    className="btn-hero-primary"
                    icon={<CarOutlined />}
                    onClick={() => navigate('/auth/delivery/register')}
                  >
                    Join as a Delivery Partner
                  </Button>
                </Col>
              </Row>
            </Col>
            <Col xs={24} lg={12}>
              <div className="image-stack">
                <img
                  src={require('../../assets/delivery-app-3d.png')}
                  alt="Delivery Partner App"
                  className="rounded-image shadow-lg floating-animate"
                />
              </div>
            </Col>
          </Row>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-box">
            <Title level={2} style={{ color: 'white' }}>Ready to get started?</Title>
            <Paragraph style={{ color: 'white', opacity: 0.9, fontSize: '18px', maxWidth: '600px', margin: '0 auto 32px' }}>
              Join the fastest growing healthcare network in Ethiopia today.
            </Paragraph>
            <Space size="middle">
              <Button size="large" className="btn-white" onClick={() => navigate('/auth/register')}>Create Free Account</Button>
              <Button size="large" type="text" style={{ color: 'white', border: '1px solid white' }} onClick={() => navigate('/contact')}>Contact Sales</Button>
            </Space>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
