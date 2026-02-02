import React from 'react';
import { Typography, Row, Col, Card, Space, Divider, Button } from 'antd';
import {
    MedicineBoxOutlined,
    GlobalOutlined,
    SafetyCertificateOutlined,
    TeamOutlined,
    MailOutlined,
    EnvironmentOutlined,
    PhoneOutlined
} from '@ant-design/icons';
import './About.css';

const { Title, Text, Paragraph } = Typography;

const About = () => {
    const values = [
        {
            icon: <GlobalOutlined style={{ fontSize: '32px', color: '#1E88E5' }} />,
            title: 'Our Mission',
            desc: 'To transform healthcare accessibility in Ethiopia by bridging the gap between pharmacies and patients through innovative technology.'
        },
        {
            icon: <SafetyCertificateOutlined style={{ fontSize: '32px', color: '#43A047' }} />,
            title: 'Our Commitment',
            desc: 'Ensuring that every medicine delivered is verified, genuine, and handled with the highest standards of safety and care.'
        },
        {
            icon: <TeamOutlined style={{ fontSize: '32px', color: '#FFB300' }} />,
            title: 'Our Community',
            desc: 'Building a network of trusted healthcare providers and reliable delivery partners to serve our citizens 24/7.'
        }
    ];

    return (
        <div className="about-page fade-in">
            {/* Hero Section */}
            <div className="about-hero">
                <div className="container">
                    <Row align="middle" gutter={[48, 48]}>
                        <Col xs={24} lg={12}>
                            <Title className="hero-title">Revolutionizing <span className="highlight">Healthcare</span> Delivery</Title>
                            <Paragraph className="hero-subtitle">
                                MediLink is Ethiopia\'s premier digital health platform, dedicated to making pharmaceuticals
                                accessible, affordable, and traceable for everyone.
                            </Paragraph>
                            <Space size="large">
                                <Button type="primary" size="large" href="#contact">Get in Touch</Button>
                                <Button size="large" icon={<MedicineBoxOutlined />}>Our Services</Button>
                            </Space>
                        </Col>
                        <Col xs={24} lg={12} className="hero-image-container">
                            <div className="abstract-shape"></div>
                            <img
                                src="https://images.unsplash.com/photo-1576091160550-217359991f8e?auto=format&fit=crop&q=80&w=600"
                                alt="Healthcare Innovation"
                                className="hero-main-img"
                            />
                        </Col>
                    </Row>
                </div>
            </div>

            {/* Values Section */}
            <div className="values-section">
                <div className="container">
                    <Row gutter={[32, 32]}>
                        {values.map((v, i) => (
                            <Col xs={24} md={8} key={i}>
                                <Card className="value-card" bordered={false}>
                                    <div className="value-icon-wrapper">
                                        {v.icon}
                                    </div>
                                    <Title level={4}>{v.title}</Title>
                                    <Text type="secondary">{v.desc}</Text>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </div>
            </div>

            {/* Story Section */}
            <div className="story-section container">
                <Row gutter={[48, 48]} align="middle">
                    <Col xs={24} md={10}>
                        <img
                            src="https://images.unsplash.com/photo-1559839734-2b71f1e3c770?auto=format&fit=crop&q=80&w=600"
                            alt="Medical Professional"
                            className="story-img"
                        />
                    </Col>
                    <Col xs={24} md={14}>
                        <Title level={2}>Why MediLink?</Title>
                        <Paragraph>
                            Founded with a vision to eliminate the struggle of finding essential medicines, MediLink
                            connects patients directly with local pharmacies. We understand that in healthcare,
                            every minute counts. Our platform ensures you can find what you need, order it securely,
                            and have it delivered to your doorstep.
                        </Paragraph>
                        <Divider />
                        <Row gutter={24}>
                            <Col span={12}>
                                <Title level={3} style={{ margin: 0, color: '#1E88E5' }}>500+</Title>
                                <Text type="secondary">Verified Pharmacies</Text>
                            </Col>
                            <Col span={12}>
                                <Title level={3} style={{ margin: 0, color: '#1E88E5' }}>10k+</Title>
                                <Text type="secondary">Successful Deliveries</Text>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </div>

            {/* Contact Section */}
            <div id="contact" className="contact-section">
                <div className="container">
                    <Card className="contact-card">
                        <Row gutter={[48, 48]}>
                            <Col xs={24} md={12}>
                                <Title level={2}>Contact Us</Title>
                                <Paragraph type="secondary">
                                    Have questions or want to partner with us? Our team is here to help.
                                    Reach out to us through any of these channels.
                                </Paragraph>
                                <Space direction="vertical" size="large" style={{ width: '100%', marginTop: '24px' }}>
                                    <div className="contact-item">
                                        <MailOutlined className="contact-icon" />
                                        <div>
                                            <Text strong block>Official Email</Text>
                                            <a href="mailto:medilinksender@gmail.com">medilinksender@gmail.com</a>
                                        </div>
                                    </div>
                                    <div className="contact-item">
                                        <PhoneOutlined className="contact-icon" />
                                        <div>
                                            <Text strong block>Phone Support</Text>
                                            <Text>+251 911 234 567</Text>
                                        </div>
                                    </div>
                                    <div className="contact-item">
                                        <EnvironmentOutlined className="contact-icon" />
                                        <div>
                                            <Text strong block>Office Location</Text>
                                            <Text>Bole Road, Mega Building, Addis Ababa</Text>
                                        </div>
                                    </div>
                                </Space>
                            </Col>
                            <Col xs={24} md={12}>
                                <div className="contact-placeholder-img">
                                    <img
                                        src="https://images.unsplash.com/photo-1423666639041-f56000c27a9a?auto=format&fit=crop&q=80&w=600"
                                        alt="Contact Us"
                                    />
                                </div>
                            </Col>
                        </Row>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default About;
