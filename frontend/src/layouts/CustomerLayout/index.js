import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Layout,
  Menu,
  Avatar,
  Dropdown,
  Button,
  Badge,
  Typography,
  Space,
  theme
} from 'antd';
import {
  DashboardOutlined,
  ShoppingOutlined,
  FileTextOutlined,
  HeartOutlined,
  UserOutlined,
  LogoutOutlined,
  ShoppingCartOutlined,
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HomeOutlined,
  HistoryOutlined,
  MedicineBoxOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { Outlet } from 'react-router-dom';
import './styles.css';

const { Header, Sider, Content } = Layout;

const CustomerLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenu = (
    <Menu
      items={[
        {
          key: '1',
          icon: <UserOutlined />,
          label: 'Profile',
          onClick: () => navigate('/customer/profile'),
        },
        {
          type: 'divider',
        },
        {
          key: '2',
          icon: <LogoutOutlined />,
          label: 'Logout',
          danger: true,
          onClick: handleLogout,
        },
      ]}
    />
  );

  const menuItems = [
    {
      key: '/customer/home',
      icon: <HomeOutlined />,
      label: 'Dashboard',
      path: '/customer/home',
    },
    {
      key: '/customer/prescriptions',
      icon: <FileTextOutlined />,
      label: 'Prescriptions',
      path: '/customer/prescriptions',
    },
    {
      key: '/customer/orders',
      icon: <ShoppingOutlined />,
      label: 'My Orders',
      path: '/customer/orders',
    },
    {
      key: '/customer/cart',
      icon: <ShoppingCartOutlined />,
      label: 'Cart',
      path: '/customer/cart',
    },
    {
      key: '/customer/favorites',
      icon: <HeartOutlined />,
      label: 'Favorites',
      path: '/customer/favorites',
    },
    {
      key: '/customer/history',
      icon: <HistoryOutlined />,
      label: 'Order History',
      path: '/customer/history',
    },
  ];

  return (
    <Layout className="customer-layout">
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        width={250}
        className="sider"
        theme="light"
      >
        <div className="logo">
          <MedicineBoxOutlined className="logo-icon" />
          {!collapsed && <span className="logo-text">MediLink</span>}
        </div>
        
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems.map(item => ({
            ...item,
            onClick: () => navigate(item.path)
          }))}
          className="menu"
        />
      </Sider>
      
      <Layout className="site-layout">
        <Header className="header" style={{ background: colorBgContainer }}>
          <div className="header-left">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: '16px',
                width: 64,
                height: 64,
              }}
            />
          </div>
          
          <div className="header-right">
            <Space size="large">
              <Badge count={3} size="small">
                <Button 
                  type="text" 
                  icon={<ShoppingCartOutlined style={{ fontSize: '20px' }} />}
                  onClick={() => navigate('/customer/cart')}
                />
              </Badge>
              
              <Dropdown overlay={userMenu} placement="bottomRight" arrow>
                <div className="user-avatar">
                  <Avatar 
                    size={36} 
                    icon={<UserOutlined />} 
                    style={{ backgroundColor: '#1890ff', cursor: 'pointer' }}
                  />
                  {!collapsed && (
                    <span className="user-name">
                      {user?.firstName || 'User'}
                    </span>
                  )}
                </div>
              </Dropdown>
            </Space>
          </div>
        </Header>
        
        <Content
          className="site-layout-background"
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: 8,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default CustomerLayout;
