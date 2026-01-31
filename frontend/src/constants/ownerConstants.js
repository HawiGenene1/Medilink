import {
    DashboardOutlined,
    TeamOutlined,
    MedicineBoxOutlined,
    ShoppingOutlined,
    UserOutlined,
    SettingOutlined,
    CreditCardOutlined,
    BarChartOutlined,
    LineChartOutlined,
    ShopOutlined
} from '@ant-design/icons';

export const OWNER_ROLES = {
    PHARMACIST: 'pharmacist',
    TECHNICIAN: 'technician',
    ASSISTANT: 'assistant',
    ADMIN: 'admin',
};

export const OWNER_MENU_ITEMS = [
    {
        key: '/owner/dashboard',
        icon: DashboardOutlined,
        label: 'Overview',
    },
    {
        key: '/owner/staff',
        icon: TeamOutlined,
        label: 'Staff Management',
    },
    {
        key: '/owner/inventory',
        icon: MedicineBoxOutlined,
        label: 'Inventory',
    },
    {
        key: '/owner/orders',
        icon: ShoppingOutlined,
        label: 'Order Processing',
    },
    {
        key: '/owner/pharmacy',
        icon: ShopOutlined,
        label: 'Pharmacy Details',
    },
    {
        key: '/owner/subscription',
        icon: CreditCardOutlined,
        label: 'Subscription',
    },
    {
        key: '/owner/reports',
        icon: BarChartOutlined,
        label: 'Reports',
    },
    {
        key: '/owner/analytics',
        icon: LineChartOutlined,
        label: 'Analytics',
    },
    {
        key: '/owner/profile',
        icon: UserOutlined,
        label: 'My Profile',
    },
    {
        key: '/owner/settings',
        icon: SettingOutlined,
        label: 'Settings',
    },
];
