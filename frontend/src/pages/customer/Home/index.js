import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Layout, Menu, Card, Row, Col, Typography, Button, Badge, List, Avatar, 
  Tag, Space, Input, Dropdown, message, Modal, Upload, Empty
} from 'antd';
import { 
  ShoppingCartOutlined, 
  MedicineBoxOutlined, 
  HistoryOutlined, 
  HeartOutlined, 
  UserOutlined, 
  LogoutOutlined, 
  SearchOutlined,
  BellOutlined,
  ArrowRightOutlined,
  InboxOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  StarFilled,
  MenuOutlined,
  CloseOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { useAuth } from '../../../contexts/AuthContext';
import './styles.css';

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;
const { Search } = Input;
const { Dragger } = Upload;

// Mock data - replace with actual API calls
const recentOrders = [
  { id: 1, name: 'Paracetamol 500mg', status: 'Delivered', date: '2025-12-20' },
  { id: 2, name: 'Vitamin C 1000mg', status: 'In Transit', date: '2025-12-22' },
  { id: 3, name: 'Multivitamin Tablets', status: 'Processing', date: '2025-12-24' },
];

const recommendedMeds = [
  { 
    id: 1, 
    name: 'Ibuprofen 400mg', 
    price: 5.99, 
    inStock: true, 
    requiresPrescription: false,
    rating: 4.5,
    manufacturer: 'ABC Pharma',
    category: 'Pain Relief'
  },
  { 
    id: 2, 
    name: 'Vitamin D3 2000IU', 
    price: 12.99, 
    inStock: true, 
    requiresPrescription: false,
    rating: 4.7,
    manufacturer: 'NatureMade',
    category: 'Vitamins',
    originalPrice: 15.99
  },
  { 
    id: 3, 
    name: 'Amoxicillin 500mg', 
    price: 15.49, 
    inStock: true, 
    requiresPrescription: true,
    rating: 4.3,
    manufacturer: 'Pfizer',
    category: 'Antibiotics'
  },
  { 
    id: 4, 
    name: 'Cetirizine 10mg', 
    price: 8.25, 
    inStock: true, 
    requiresPrescription: false,
    rating: 4.2,
    manufacturer: 'Zyrtec',
    category: 'Allergy',
    originalPrice: 10.50
  },
];

const CustomerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [prescriptionModalVisible, setPrescriptionModalVisible] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [cart, setCart] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      const isMobileView = window.innerWidth < 992;
      setIsMobile(isMobileView);
      if (!isMobileView) {
        setMobileMenuVisible(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    if (isMobile) {
      setMobileMenuVisible(!mobileMenuVisible);
    } else {
      setCollapsed(!collapsed);
    }
  };

  // Toggle sidebar collapse (for desktop)
  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  // Close mobile menu when clicking a menu item
  const handleMenuClick = (e) => {
    if (e.key) {
      setActiveMenu(e.key);
      if (isMobile) {
        setMobileMenuVisible(false);
      }
    }
  };

  // Load cart from localStorage on component mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearch = (value) => {
    message.info(`Searching for: ${value}`);
    navigate(`/medicines?search=${encodeURIComponent(value)}`);
  };

  const handleAddToCart = (medicine) => {
    if (medicine.requiresPrescription) {
      setSelectedMedicine(medicine);
      setPrescriptionModalVisible(true);
      return;
    }
    
    const newCart = { ...cart };
    if (newCart[medicine.id]) {
      newCart[medicine.id].quantity += 1;
    } else {
      newCart[medicine.id] = {
        ...medicine,
        quantity: 1,
        addedAt: new Date().toISOString()
      };
    }
    
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
    message.success(`${medicine.name} added to cart`);
  };

  const handlePrescriptionUpload = (file) => {
    // In a real app, you would upload the file to your server
    message.success('Prescription uploaded successfully');
    setPrescriptionModalVisible(false);
    
    if (selectedMedicine) {
      handleAddToCart(selectedMedicine);
    }
  };

  const getCartCount = () => {
    return Object.values(cart).reduce((total, item) => total + item.quantity, 0);
  };

  const menu = (
    <Menu>
      <Menu.Item key="profile" onClick={() => navigate('/customer/profile')}>
        <UserOutlined /> Profile
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" onClick={handleLogout}>
        <LogoutOutlined /> Logout
      </Menu.Item>
    </Menu>
  );

  return (
    <Layout style={{ minHeight: '100vh' }} className={collapsed ? 'site-layout-collapsed' : ''}>
      {/* Mobile menu toggle button */}
      {isMobile && (
        <div className="menu-collapse-button" onClick={toggleMobileMenu}>
          {mobileMenuVisible ? <CloseOutlined /> : <MenuOutlined />}
        </div>
      )}
      
      <Sider 
        collapsible 
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={250}
        className={`sidebar ${mobileMenuVisible ? 'mobile-visible' : ''}`}
        trigger={null}
        collapsedWidth={isMobile ? 0 : 80}
      >
        <div className="logo" onClick={() => navigate('/customer')}>
          <MedicineBoxOutlined style={{ fontSize: '24px', marginRight: collapsed ? 0 : 8 }} />
          {!collapsed && <span>MediLink</span>}
        </div>
        
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[activeMenu]}
          className="menu"
          onClick={handleMenuClick}
        >
          <Menu.Item 
            key="dashboard" 
            icon={<MedicineBoxOutlined />}
            onClick={() => {
              setActiveMenu('dashboard');
              navigate('/customer');
            }}
          >
            Home
          </Menu.Item>
          <Menu.Item 
            key="medicines" 
            icon={<MedicineBoxOutlined />}
            onClick={() => {
              setActiveMenu('medicines');
              navigate('/medicines');
            }}
          >
            Browse Medicines
          </Menu.Item>
          <Menu.Item 
            key="prescriptions" 
            icon={<FileTextOutlined />}
            onClick={() => {
              setActiveMenu('prescriptions');
              navigate('/customer/prescriptions');
            }}
          >
            My Prescriptions
          </Menu.Item>
          <Menu.Item 
            key="orders" 
            icon={<ShoppingCartOutlined />}
            onClick={() => {
              setActiveMenu('orders');
              navigate('/customer/orders');
            }}
          >
            My Orders
          </Menu.Item>
          <Menu.Item 
            key="favorites" 
            icon={<HeartOutlined />}
            onClick={() => {
              setActiveMenu('favorites');
              navigate('/customer/favorites');
            }}
          >
            Favorites
          </Menu.Item>
        </Menu>
      </Sider>

      <Layout className="site-layout">
        <Header className="site-layout-header">
          <div className="header-content">
            {!isMobile && (
              <div className="menu-collapse-button" onClick={toggleSidebar}>
                {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              </div>
            )}
            <Search
              placeholder="Search medicines..."
              allowClear
              enterButton={<SearchOutlined />}
              size={isMobile ? 'default' : 'large'}
              onSearch={handleSearch}
              style={{ width: isMobile ? '100%' : 400, maxWidth: isMobile ? 300 : 'none' }}
            />
            
            <div className="header-actions">
              <Badge count={getCartCount()} className="cart-badge">
                <Button 
                  type="text" 
                  icon={<ShoppingCartOutlined style={{ fontSize: '20px' }} />}
                  onClick={() => navigate('/customer/cart')}
                />
              </Badge>
              
              <Badge count={3} className="notification-badge">
                <Button type="text" icon={<BellOutlined style={{ fontSize: '20px' }} />} />
              </Badge>
              
              <Dropdown overlay={menu} trigger={['click']}>
                <div className="user-profile">
                  <Avatar 
                    size={36} 
                    icon={<UserOutlined />} 
                    style={{ backgroundColor: '#1890ff', cursor: 'pointer' }}
                  />
                  <span className="user-name">
                    {user?.firstName || 'User'}
                  </span>
                </div>
              </Dropdown>
            </div>
          </div>
        </Header>
        
        <Content className="site-layout-content">
          <div className="container">
            {/* Welcome Banner */}
            <div className="welcome-banner">
              <div className="welcome-content">
                <Title level={3}>Welcome back, {user?.firstName || 'Customer'}!</Title>
                <Text type="secondary">What would you like to order today?</Text>
              </div>
              <div className="welcome-actions">
                <Space>
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={() => navigate('/medicines')}
                  >
                    Shop Now
                  </Button>
                  <Button 
                    type="default" 
                    icon={<FileTextOutlined />}
                    onClick={() => navigate('/customer/prescriptions/upload')}
                  >
                    Upload Prescription
                  </Button>
                </Space>
              </div>
            </div>

            {/* Quick Actions */}
            <Row gutter={[16, 16]} className="quick-actions-row">
              <Col xs={24} sm={12} md={8}>
                <Card 
                  className="dashboard-card quick-action-card"
                  hoverable
                  onClick={() => navigate('/medicines')}
                >
                  <div className="quick-action-content">
                    <MedicineBoxOutlined className="quick-action-icon" />
                    <div className="quick-action-text">
                      <Title level={5}>Browse Medicines</Title>
                      <Text type="secondary">Find your medications</Text>
                    </div>
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card 
                  className="dashboard-card quick-action-card"
                  hoverable
                  onClick={() => navigate('/customer/prescriptions/upload')}
                >
                  <div className="quick-action-content">
                    <FileTextOutlined className="quick-action-icon" />
                    <div className="quick-action-text">
                      <Title level={5}>Upload Prescription</Title>
                      <Text type="secondary">Submit your prescription</Text>
                    </div>
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card 
                  className="dashboard-card quick-action-card"
                  hoverable
                  onClick={() => navigate('/customer/orders')}
                >
                  <div className="quick-action-content">
                    <HistoryOutlined className="quick-action-icon" />
                    <div className="quick-action-text">
                      <Title level={5}>Order History</Title>
                      <Text type="secondary">View your orders</Text>
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>

            {/* Quick Categories */}
            <div className="quick-categories">
              <Button 
                type="text" 
                onClick={() => navigate('/medicines?category=Pain+Relief')}
              >
                Pain Relief
              </Button>
              <Button 
                type="text" 
                onClick={() => navigate('/medicines?category=Allergy')}
              >
                Allergy
              </Button>
              <Button 
                type="text" 
                onClick={() => navigate('/medicines?category=Vitamins')}
              >
                Vitamins
              </Button>
              <Button 
                type="text" 
                onClick={() => navigate('/medicines?category=First+Aid')}
              >
                First Aid
              </Button>
            </div>

            {/* Featured Products */}
            <div className="section">
              <div className="section-header">
                <Title level={4}>Featured Products</Title>
                <Button type="link" onClick={() => navigate('/medicines')}>
                  View All <ArrowRightOutlined />
                </Button>
              </div>
              
              <Row gutter={[16, 16]}>
                {recommendedMeds.map(medicine => (
                  <Col xs={24} sm={12} md={8} lg={6} key={medicine.id}>
                    <Card
                      hoverable
                      className="medicine-card"
                      cover={
                        <div className="medicine-image">
                          <MedicineBoxOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
                        </div>
                      }
                      actions={medicine.requiresPrescription ? [
                        <Button 
                          type="primary" 
                          block 
                          icon={<FileTextOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMedicine(medicine);
                            setPrescriptionModalVisible(true);
                          }}
                        >
                          Prescription Required
                        </Button>
                      ] : [
                        <Button 
                          type="primary" 
                          block 
                          disabled={!medicine.inStock}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(medicine);
                          }}
                        >
                          {medicine.inStock ? 'Add to Cart' : 'Out of Stock'}
                        </Button>
                      ]}
                      onClick={() => navigate(`/medicines/${medicine.id}`)}
                    >
                      <div className="medicine-info">
                        <div className="medicine-header">
                          <Title level={5} ellipsis={{ rows: 1 }} className="medicine-name">
                            {medicine.name}
                          </Title>
                          {medicine.requiresPrescription && (
                            <Tag color="orange" icon={<FileTextOutlined />}>Prescription</Tag>
                          )}
                        </div>
                        
                        <div className="medicine-details">
                          <div className="medicine-meta">
                            <div className="rating">
                              <StarFilled style={{ color: '#faad14' }} />
                              <span>{medicine.rating}</span>
                            </div>
                            <div className="manufacturer">{medicine.manufacturer}</div>
                          </div>
                          
                          <div className="price-section">
                            <Text strong className="price">${medicine.price.toFixed(2)}</Text>
                            {medicine.originalPrice && (
                              <Text delete type="secondary" className="original-price">
                                ${medicine.originalPrice.toFixed(2)}
                              </Text>
                            )}
                            {medicine.originalPrice && (
                              <Tag color="red" className="discount-tag">
                                {Math.round((1 - medicine.price / medicine.originalPrice) * 100)}% OFF
                              </Tag>
                            )}
                          </div>
                          
                          <div className="stock-status">
                            {medicine.inStock ? (
                              <Text type="success">In Stock</Text>
                            ) : (
                              <Text type="danger">Out of Stock</Text>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>

            {/* Recent Orders */}
            <div className="section">
              <div className="section-header">
                <Title level={4}>Recent Orders</Title>
                <Button type="link" onClick={() => navigate('/customer/orders')}>
                  View All <ArrowRightOutlined />
                </Button>
              </div>
              
              <Card className="recent-orders-card">
                {recentOrders.length > 0 ? (
                  <List
                    itemLayout="horizontal"
                    dataSource={recentOrders}
                    renderItem={order => (
                      <List.Item 
                        className="order-item"
                        onClick={() => navigate(`/customer/orders/${order.id}`)}
                      >
                        <List.Item.Meta
                          title={order.name}
                          description={`Order #${order.id} • ${order.date}`}
                        />
                        <div className="order-status">
                          <Tag 
                            color={
                              order.status === 'Delivered' ? 'success' : 
                              order.status === 'In Transit' ? 'processing' : 'default'
                            }
                          >
                            {order.status}
                          </Tag>
                          <Button 
                            type="link" 
                            icon={<ArrowRightOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/customer/orders/${order.id}`);
                            }}
                          />
                        </div>
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty 
                    description={
                      <span>You don't have any recent orders</span>
                    }
                  >
                    <Button 
                      type="primary" 
                      onClick={() => navigate('/medicines')}
                    >
                      Shop Now
                    </Button>
                  </Empty>
                )}
              </Card>
            </div>
          </div>
        </Content>
      </Layout>

      {/* Prescription Required Modal */}
      <Modal
        title={
          <>
            <ExclamationCircleOutlined style={{ color: '#faad14', marginRight: 8 }} />
            Prescription Required
          </>
        }
        visible={prescriptionModalVisible}
        onCancel={() => setPrescriptionModalVisible(false)}
        footer={null}
        width={600}
      >
        <div className="prescription-modal">
          <div className="prescription-info">
            <p>
              <strong>{selectedMedicine?.name}</strong> requires a valid prescription.
            </p>
            <p>Please upload a clear photo of your prescription to continue with your order.</p>
            
            <Dragger
              name="prescription"
              multiple={false}
              accept=".jpg,.jpeg,.png,.pdf"
              showUploadList={false}
              beforeUpload={(file) => {
                handlePrescriptionUpload(file);
                return false;
              }}
              className="prescription-upload"
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
              </p>
              <p className="ant-upload-text">Click or drag file to upload</p>
              <p className="ant-upload-hint">
                Supported formats: JPG, PNG, PDF (Max: 5MB)
              </p>
            </Dragger>
            
            <div className="prescription-actions">
              <Button 
                type="primary" 
                onClick={() => {
                  setPrescriptionModalVisible(false);
                  navigate('/customer/prescriptions/upload');
                }}
                block
                size="large"
              >
                Go to Prescriptions Page
              </Button>
              
              <Button 
                type="text" 
                onClick={() => setPrescriptionModalVisible(false)}
                block
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default CustomerDashboard;
