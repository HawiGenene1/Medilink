import {
    DashboardOutlined,
    TeamOutlined,
    MedicineBoxOutlined,
    ShoppingOutlined,
    UserOutlined,
    SettingOutlined,
    CreditCardOutlined,
    BarChartOutlined,
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
        key: '/owner/pharmacy',
        icon: MedicineBoxOutlined,
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
