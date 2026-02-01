import React from 'react';
import { Row, Col, Typography, Space, Input, Button } from 'antd';
import {
  FacebookFilled,
  TwitterCircleFilled,
  InstagramFilled,
  LinkedinFilled,
  MedicineBoxOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import './Footer.css';

const { Title, Text, Link } = Typography;

const Footer = () => {
  return (
    <footer className="footer-section">
      <div className="container">
        <Row gutter={[48, 48]}>
          {/* Column 1: Brand & Contact */}
          <Col xs={24} md={8}>
            <div className="footer-brand">
              <MedicineBoxOutlined className="footer-logo-icon" />
              <Title level={3} className="footer-logo-text">MediLink</Title>
            </div>
            <Text className="footer-desc">
              Your trusted partner for health and wellness. Connecting patients with pharmacies for seamless care delivery.
            </Text>
            <div className="contact-info">
              <Space direction="vertical" size="middle">
                <Text><EnvironmentOutlined /> Bole Road, Addis Ababa, Ethiopia</Text>
                <Text><PhoneOutlined /> +251 911 234 567</Text>
                <Text><MailOutlined /> support@medilink.com</Text>
              </Space>
            </div>
          </Col>

          {/* Column 2: Products & Services */}
          <Col xs={24} sm={12} md={5}>
            <Title level={5} className="footer-heading">Services</Title>
            <Space direction="vertical" size="middle" className="footer-links">
              <Link href="#">Order Medicine</Link>
              <Link href="#">Upload Prescription</Link>
              <Link href="#">Consult Pharmacist</Link>
              <Link href="#">Partner Pharmacies</Link>
              <Link href="#">Health Blog</Link>
            </Space>
          </Col>

          {/* Column 3: Company & Legal */}
          <Col xs={24} sm={12} md={5}>
            <Title level={5} className="footer-heading">Company</Title>
            <Space direction="vertical" size="middle" className="footer-links">
              <Link href="#">About Us</Link>
              <Link href="#">Careers</Link>
              <Link href="#">Privacy Policy</Link>
              <Link href="#">Terms of Service</Link>
              <Link href="#">Help Center</Link>
            </Space>
          </Col>

          {/* Column 4: Newsletter */}
          <Col xs={24} md={6}>
            <Title level={5} className="footer-heading">Stay Updated</Title>
            <Text className="footer-desc" style={{ marginBottom: '16px', display: 'block' }}>
              Subscribe to our newsletter for health tips and exclusive offers.
            </Text>
            <div className="newsletter-form">
              <Input placeholder="Enter your email" style={{ marginBottom: '12px' }} />
              <Button type="primary" block>Subscribe</Button>
            </div>
            <div className="social-links" style={{ marginTop: '24px' }}>
              <Space size="large">
                <FacebookFilled className="social-icon" />
                <TwitterCircleFilled className="social-icon" />
                <InstagramFilled className="social-icon" />
                <LinkedinFilled className="social-icon" />
              </Space>
            </div>
          </Col>
        </Row>

        <div className="footer-bottom">
          <Text type="secondary">© 2026 MediLink. All Rights Reserved.</Text>
          <div className="trust-badges">
            {/* Placeholders for trust badges */}
            <Text type="secondary" style={{ fontSize: '12px' }}>Secure Payments by Chapa</Text>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
