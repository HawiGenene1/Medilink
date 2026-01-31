import React, { useState } from 'react';
import { Layout, Menu, Input, Avatar, Badge, Dropdown, Button, Drawer, Space, Typography, theme } from 'antd';
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
import { useNotifications } from '../contexts/NotificationContext';
import { useUI } from '../contexts/UIContext';
import './CommonDashboardLayout.css';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const SidebarContent = ({ collapsed, navigate, location, menuItems, handleMenuClick, token }) => (
    <div className="sidebar-container">
        <div className="sidebar-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer', borderColor: token.colorBorderSecondary }}>
            <div className="logo-icon-box" style={{ background: token.colorPrimary }}>ML</div>
            {!collapsed && <span className="logo-text" style={{ color: token.colorText }}>MediLink</span>}
        </div>
        <Menu
            theme={token.isDark ? 'dark' : 'light'}
            mode="inline"
            selectedKeys={[location.pathname]}
            onClick={handleMenuClick}
            items={menuItems}
            className="sidebar-menu"
            style={{ borderRight: 'none', background: 'transparent' }}
        />
    </div>
);

const CommonDashboardLayout = ({ children, menuItems, role, onSearch }) => {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
    const [locationModalOpen, setLocationModalOpen] = useState(false);
    const [currentLocation, setCurrentLocation] = useState('Addis Ababa');
    const [searchValue, setSearchValue] = useState('');

    // Hooks
    const { user, logout } = useAuth();
    const { unreadCount } = useNotifications();
    const { theme: appTheme } = useUI();
    const { token } = theme.useToken();
    const navigate = useNavigate();
    const location = useLocation();

    // Helper to determine if we are in dark mode effectively
    // appTheme from UIContext is 'light' | 'dark'
    const isDark = appTheme === 'dark';

    // Augment token with isDark for easy passing
    const extendedToken = { ...token, isDark };

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

    // Dynamic Header Style
    const headerStyle = {
        background: token.colorBgContainer,
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        boxShadow: isDark ? '0 1px 2px rgba(0, 0, 0, 0.3)' : '0 1px 2px rgba(0, 0, 0, 0.03)'
    };

    return (
        <Layout className="dashboard-layout" style={{ background: token.colorBgLayout }}>
            {/* Desktop Sidebar */}
            <Sider
                trigger={null}
                collapsible
                collapsed={collapsed}
                className="desktop-sider"
                width={260}
                theme={isDark ? 'dark' : 'light'}
                style={{
                    background: token.colorBgContainer,
                    borderRight: `1px solid ${token.colorBorderSecondary}`
                }}
            >
                <SidebarContent
                    collapsed={collapsed}
                    navigate={navigate}
                    location={location}
                    menuItems={menuItems}
                    handleMenuClick={handleMenuClick}
                    token={extendedToken}
                />
            </Sider>

            {/* Mobile Drawer Sidebar */}
            <Drawer
                placement="left"
                onClose={() => setMobileDrawerOpen(false)}
                open={mobileDrawerOpen}
                styles={{
                    body: { padding: 0 }
                }}
                width={260}
                closable={false}
            >
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: token.colorBgContainer }}>
                    <SidebarContent
                        collapsed={collapsed}
                        navigate={navigate}
                        location={location}
                        menuItems={menuItems}
                        handleMenuClick={handleMenuClick}
                        token={extendedToken}
                    />
                </div>
            </Drawer>

            <Layout className="site-layout" style={{ background: 'transparent' }}>
                <Header className="dashboard-header" style={headerStyle}>
                    <div className="header-left">
                        {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
                            className: 'trigger desktop-trigger',
                            onClick: toggle,
                            style: { color: token.colorText }
                        })}
                        {React.createElement(MenuUnfoldOutlined, {
                            className: 'trigger mobile-trigger',
                            onClick: () => setMobileDrawerOpen(true),
                            style: { color: token.colorText }
                        })}

                        {/* Search Bar - only for customer */}
                        {role === 'customer' && (
                            <div className="header-search">
                                <Input
                                    placeholder="Search medicine (e.g. Paracetamol)"
                                    prefix={<SearchOutlined style={{ color: token.colorTextDescription }} />}
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
                                    style={{
                                        background: token.colorFillAlter,
                                        color: token.colorText
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    <div className="header-right">
                        {role === 'customer' && (
                            <div
                                className="header-location"
                                onClick={() => setLocationModalOpen(true)}
                                style={{
                                    background: token.colorFillAlter,
                                    color: token.colorText
                                }}
                            >
                                <span className="label-text">📍 {currentLocation}</span>
                            </div>
                        )}

                        <Badge count={unreadCount} offset={[-2, 2]} size="small">
                            <Button
                                type="text"
                                shape="circle"
                                icon={<BellOutlined />}
                                size="large"
                                onClick={() => navigate(`/${role}/notifications`)}
                                style={{ color: token.colorText }}
                            />
                        </Badge>

                        <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
                            <div className="user-profile-trigger">
                                <Avatar
                                    size="default"
                                    icon={<UserOutlined />}
                                    src={user?.avatar}
                                    style={{ backgroundColor: token.colorPrimary }}
                                />
                                <span className="username hidden-mobile" style={{ color: token.colorText }}>
                                    {user?.firstName || 'User'}
                                </span>
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
