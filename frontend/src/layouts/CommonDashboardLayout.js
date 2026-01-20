import React, { useState } from 'react';
import { Layout, Menu, Input, Avatar, Badge, Dropdown, Button, Drawer, Space, Typography } from 'antd';
import {
    MenuUnfoldOutlined,
    MenuFoldOutlined,
    SearchOutlined,
    BellOutlined,
    UserOutlined,
    LogoutOutlined,
    SettingOutlined
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
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const toggle = () => {
        setCollapsed(!collapsed);
    };

    const handleMenuClick = ({ key }) => {
        if (key === 'logout') {
            logout();
        } else {
            navigate(key);
            setMobileDrawerOpen(false); // Close drawer on mobile nav
        }
    };

    const userMenuItems = [
        {
            key: 'profile',
            icon: <UserOutlined />,
            label: 'Profile',
            onClick: () => navigate(`/${role}/profile`)
        },
        {
            key: 'settings',
            icon: <SettingOutlined />,
            label: 'Settings',
            onClick: () => navigate(`/${role}/settings`)
        },
        {
            type: 'divider'
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Logout',
            danger: true,
            onClick: logout
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
        <Layout className="dashboard-layout">
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
                            <div className="header-location" onClick={() => setLocationModalOpen(true)}>
                                <span className="label-text">📍 {currentLocation}</span>
                            </div>
                        )}

                        <Badge count={2} offset={[-2, 2]} size="small">
                            <Button
                                type="text"
                                shape="circle"
                                icon={<BellOutlined />}
                                size="large"
                                onClick={() => navigate(`/${role}/notifications`)}
                            />
                        </Badge>

                        <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
                            <div className="user-profile-trigger">
                                <Avatar
                                    size="default"
                                    icon={<UserOutlined />}
                                    src={user?.avatar}
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
