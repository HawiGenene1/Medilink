import React, { useState, useEffect } from 'react';
import { Layout, Menu, Input, Avatar, Badge, Dropdown, Button, Drawer, Space, Typography } from 'antd';
import { useCart } from '../contexts/CartContext';
import {
    MenuUnfoldOutlined,
    MenuFoldOutlined,
    SearchOutlined,
    BellOutlined,
    UserOutlined,
    LogoutOutlined,
    SettingOutlined,
    ShoppingCartOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './CommonDashboardLayout.css';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const CommonDashboardLayout = ({ children, menuItems, role, onSearch }) => {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
    const [locationModalOpen, setLocationModalOpen] = useState(false);
    const [currentLocation, setCurrentLocation] = useState('Addis Ababa');
    const [searchValue, setSearchValue] = useState('');
    const [notificationCount, setNotificationCount] = useState(0);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Safety check for useCart
    let cartCount = 0;
    try {
        const cart = useCart();
        cartCount = cart?.cartItems?.length || 0;
    } catch (e) {
        // useCart might throw if context not provided, ignore
    }

    // Fetch notifications/alerts count for pharmacy_admin
    useEffect(() => {
        const fetchNotifications = async () => {
            if (role === 'pharmacy_admin') {
                try {
                    const response = await fetch('http://localhost:5000/api/pharmacy-admin/alerts', {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    });
                    const data = await response.json();
                    if (data.success && data.data) {
                        // Count total alerts
                        const totalCount = data.data.reduce((sum, alert) => sum + (alert.count || 0), 0);
                        setNotificationCount(totalCount);
                    }
                } catch (error) {
                    console.error('Error fetching notifications:', error);
                }
            }
        };

        fetchNotifications();
        // Refresh every 60 seconds
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, [role]);

    const toggle = () => {
        setCollapsed(!collapsed);
    };

    const handleMenuClick = ({ key }) => {
        if (key === 'logout') {
            logout();
        } else {
            navigate(key);
            setMobileDrawerOpen(false);
        }
    };

    const handleUserMenuClick = ({ key }) => {
        if (key === 'logout') {
            logout();
        } else if (key === 'profile') {
            navigate(`/${role}/profile`);
        } else if (key === 'settings') {
            navigate(`/${role}/settings`);
        }
    };

    const userMenuItems = [
        {
            key: 'profile',
            icon: <UserOutlined />,
            label: 'Profile',
        },
        {
            key: 'settings',
            icon: <SettingOutlined />,
            label: 'Settings',
        },
        {
            type: 'divider'
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Logout',
            danger: true,
        }
    ];

    const SidebarContent = () => (
        <div className="sidebar-container">
            <div className="sidebar-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                <div className="logo-icon-box">ML</div>
                {!collapsed && <span className="logo-text">MediLink</span>}
            </div>
            <Menu
                theme="light"
                mode="inline"
                selectedKeys={[location.pathname]}
                onClick={handleMenuClick}
                items={menuItems}
                className="sidebar-menu"
            />
        </div>
    );

    return (
        <Layout className="dashboard-layout" hasSider>
            {/* Desktop Sidebar */}
            <Sider
                trigger={null}
                collapsible
                collapsed={collapsed}
                className="desktop-sider"
                width={260}
                theme="light"
            >
                <SidebarContent />
            </Sider>

            {/* Mobile Drawer Sidebar */}
            <Drawer
                placement="left"
                onClose={() => setMobileDrawerOpen(false)}
                open={mobileDrawerOpen}
                styles={{ body: { padding: 0 } }}
                width={260}
                closable={false}
            >
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <SidebarContent />
                </div>
            </Drawer>

            <Layout className="site-layout">
                <Header className="dashboard-header">
                    <div className="header-left">
                        {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
                            className: 'trigger desktop-trigger',
                            onClick: toggle,
                        })}
                        {React.createElement(MenuUnfoldOutlined, {
                            className: 'trigger mobile-trigger',
                            onClick: () => setMobileDrawerOpen(true),
                        })}

                        {/* Search Bar - only for customer */}
                        {role === 'customer' && (
                            <div className="header-search">
                                <Input
                                    placeholder="Search medicine (e.g. Paracetamol)"
                                    prefix={<SearchOutlined className="text-secondary" />}
                                    bordered={false}
                                    className="search-input"
                                    value={searchValue}
                                    onChange={(e) => {
                                        setSearchValue(e.target.value);
                                        if (onSearch) onSearch(e.target.value);
                                    }}
                                    onPressEnter={(e) => {
                                        if (onSearch) onSearch(e.target.value);
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    <div className="header-right">
                        {role === 'customer' && (
                            <>
                                <div className="header-location" onClick={() => setLocationModalOpen(true)}>
                                    <span className="label-text">📍 {currentLocation}</span>
                                </div>

                                <Badge count={cartCount} offset={[-2, 2]} size="small" style={{ backgroundColor: '#FF4D4F' }}>
                                    <Button
                                        type="text"
                                        shape="circle"
                                        icon={<ShoppingCartOutlined />}
                                        size="large"
                                        onClick={() => navigate('/customer/cart')}
                                    />
                                </Badge>
                            </>
                        )}

                        <Badge count={notificationCount} offset={[-2, 2]} size="small">

                            <Button
                                type="text"
                                shape="circle"
                                icon={<BellOutlined />}
                                size="large"
                                onClick={() => navigate(`/${role}/notifications`)}
                            />
                        </Badge>

                        <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} trigger={['click']} placement="bottomRight">
                            <div className="user-profile-trigger">
                                <Avatar
                                    size="default"
                                    icon={<UserOutlined />}
                                    src={user?.avatar ? (user.avatar.startsWith('http') ? user.avatar : `http://localhost:5000${user.avatar}?t=${new Date().getTime()}`) : null}
                                    style={{ backgroundColor: '#1E88E5' }}
                                />
                                <span className="username hidden-mobile">{user?.firstName || 'User'}</span>
                            </div>
                        </Dropdown>
                    </div>
                </Header>

                <Content className="dashboard-content">
                    {children}
                </Content>
            </Layout>

            {/* Global Location Modal */}
            <Drawer
                title="Change Location"
                placement="top"
                onClose={() => setLocationModalOpen(false)}
                open={locationModalOpen}
                height={300}
            >
                <div className="location-modal-content">
                    <p>Select your city to find medicines near you:</p>
                    <Space direction="vertical" style={{ width: '100%' }}>
                        {['Addis Ababa', 'Debre Zeyit', 'Adama', 'Bahir Dar', 'Awasa'].map(city => (
                            <Button
                                key={city}
                                block
                                type={currentLocation === city ? "primary" : "default"}
                                onClick={() => {
                                    setCurrentLocation(city);
                                    setLocationModalOpen(false);
                                }}
                            >
                                {city}
                            </Button>
                        ))}
                    </Space>
                </div>
            </Drawer>
        </Layout>
    );
};

export default CommonDashboardLayout;
