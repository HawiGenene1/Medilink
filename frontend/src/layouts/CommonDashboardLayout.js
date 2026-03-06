import React, { useState, useEffect } from 'react';
import { Layout, Menu, Input, Avatar, Badge, Dropdown, Button, Drawer, Space, Typography, List } from 'antd';
import { useCart } from '../contexts/CartContext';
import {
    MenuUnfoldOutlined,
    MenuFoldOutlined,
    SearchOutlined,
    BellOutlined,
    UserOutlined,
    LogoutOutlined,
    SettingOutlined,
    ShoppingCartOutlined,
    EnvironmentOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import './CommonDashboardLayout.css';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const CommonDashboardLayout = ({ children, menuItems, role, onSearch }) => {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
    const [currentLocation, setCurrentLocation] = useState('Addis Ababa');
    const [searchValue, setSearchValue] = useState('');
    const [notificationCount, setNotificationCount] = useState(0);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);

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

    // Fetch notifications/alerts count
    const fetchNotifications = async () => {
        try {
            if (role === 'pharmacy_admin') {
                const response = await fetch('http://localhost:5000/api/pharmacy-admin/alerts', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                const data = await response.json();
                if (data.success && data.data) {
                    const totalCount = data.data.reduce((sum, alert) => sum + (alert.count || 0), 0);
                    setNotificationCount(totalCount);
                }
            } else if (role === 'admin' || role === 'system_admin') {
                const response = await api.get('/admin/audit-logs?limit=5&status=FAILURE');
                if (response.data.success) {
                    setNotificationCount(response.data.data.logs.length);
                    setNotifications(response.data.data.logs.map(log => ({
                        id: log._id,
                        title: log.action,
                        description: `Action performed by ${log.user?.email || 'System'}`,
                        time: new Date(log.createdAt).toLocaleTimeString(),
                        read: false
                    })));
                }
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, [role]);

    const handleNotificationClick = () => {
        setNotificationsOpen(true);
        fetchNotifications();
    };

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

    const locationMenuItems = ['Addis Ababa', 'Debre Zeyit', 'Adama', 'Bahir Dar', 'Awasa'].map(city => ({
        key: city,
        label: city,
        onClick: () => setCurrentLocation(city)
    }));

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
                collapsedWidth={80}
                className="desktop-sider"
                width={240}
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
                                <Dropdown
                                    menu={{
                                        items: locationMenuItems,
                                        selectable: true,
                                        selectedKeys: [currentLocation]
                                    }}
                                    trigger={['click']}
                                    placement="bottomCenter"
                                >
                                    <div className="header-location">
                                        <EnvironmentOutlined style={{ marginRight: '6px', color: 'var(--primary-color)' }} />
                                        <span className="label-text" style={{ fontSize: '12px', fontWeight: 600 }}>{currentLocation}</span>
                                    </div>
                                </Dropdown>

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
                                onClick={handleNotificationClick}
                            />
                        </Badge>

                        <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} trigger={['click']} placement="bottomRight">
                            <div className="user-profile-trigger">
                                <Avatar
                                    size="default"
                                    icon={<UserOutlined />}
                                    src={user?.avatar ? (user.avatar.startsWith('http') ? user.avatar : `http://localhost:5000${user.avatar}?t=${new Date().getTime()}`) : null}
                                    style={{ backgroundColor: 'var(--primary-color)' }}
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

            <Drawer
                title="Notifications & Alerts"
                placement="right"
                onClose={() => setNotificationsOpen(false)}
                open={notificationsOpen}
                width={350}
            >
                <List
                    itemLayout="horizontal"
                    dataSource={notifications}
                    renderItem={item => (
                        <List.Item
                            actions={[<Button type="link" size="small">Clear</Button>]}
                            style={{ opacity: item.read ? 0.6 : 1 }}
                        >
                            <List.Item.Meta
                                avatar={<Badge dot={!item.read}><BellOutlined style={{ fontSize: 20 }} /></Badge>}
                                title={item.title}
                                description={
                                    <Space direction="vertical" size={0}>
                                        <Text style={{ fontSize: 13 }}>{item.description}</Text>
                                        <Text type="secondary" style={{ fontSize: 12 }}>{item.time}</Text>
                                    </Space>
                                }
                            />
                        </List.Item>
                    )}
                    locale={{ emptyText: 'No new notifications' }}
                />
                {notifications.length > 0 && (
                    <Button block style={{ marginTop: 16 }} onClick={() => setNotifications([])}>Clear All</Button>
                )}
            </Drawer>

            {/* Global Location Dropdown is now handled via the div trigger above */}
        </Layout>
    );
};

export default CommonDashboardLayout;
