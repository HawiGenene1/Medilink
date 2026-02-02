import apiClient from './config';

const adminService = {
    // Dashboard Analytics
    getDashboardStats: async () => {
        const response = await apiClient.get('/admin/analytics/dashboard');
        return response.data;
    },

    getDetailedAnalytics: async () => {
        const response = await apiClient.get('/admin/analytics/detailed');
        return response.data;
    },

    // User Management
    getAllUsers: async (params) => {
        const response = await apiClient.get('/admin/users', { params });
        return response.data;
    },

    getUserById: async (id) => {
        const response = await apiClient.get(`/admin/users/${id}`);
        return response.data;
    },

    updateUserRole: async (id, role, reason) => {
        const response = await apiClient.patch(`/admin/users/${id}/role`, { role, reason });
        return response.data;
    },

    disableUser: async (id, reason) => {
        const response = await apiClient.patch(`/admin/users/${id}/disable`, { reason });
        return response.data;
    },

    enableUser: async (id) => {
        const response = await apiClient.patch(`/admin/users/${id}/enable`);
        return response.data;
    },

    resetPassword: async (id) => {
        const response = await apiClient.patch(`/admin/users/${id}/reset-password`);
        return response.data;
    },

    revokeSessions: async (id) => {
        const response = await apiClient.patch(`/admin/users/${id}/revoke-sessions`);
        return response.data;
    },

    // Registration Management
    getPendingRegistrations: async () => {
        const response = await apiClient.get('/admin/registrations/pending');
        return response.data;
    },

    // Pharmacy Management
    getAllPharmacies: async (params) => {
        const response = await apiClient.get('/admin/pharmacies', { params });
        return response.data;
    },

    getPharmacyById: async (id) => {
        const response = await apiClient.get(`/admin/pharmacies/${id}`);
        return response.data;
    },
    createAdminUser: async (userData) => {
        const response = await apiClient.post('/admin/users/create-admin', userData);
        return response.data;
    },

    // Data Export
    exportData: async (type, format = 'json', filters = {}) => {
        const response = await apiClient.post('/admin/data/export', { type, format, filters }, {
            responseType: 'blob' // Important for file download
        });
        return response;
    },

    // Subscription Management
    getAllSubscriptions: async (params) => {
        const response = await apiClient.get('/admin/subscriptions', { params });
        return response.data;
    },

    activateSubscription: async (id) => {
        const response = await apiClient.post(`/admin/subscriptions/${id}/activate`);
        return response.data;
    },

    deactivateSubscription: async (id, data) => {
        const response = await apiClient.post(`/admin/subscriptions/${id}/deactivate`, data);
        return response.data;
    },

    renewSubscription: async (id, data) => {
        const response = await apiClient.post(`/admin/subscriptions/${id}/renew`, data);
        return response.data;
    },

    // Audit Logs
    getAuditLogs: async (params) => {
        const response = await apiClient.get('/admin/audit', { params });
        return response.data;
    },

    // System Settings
    getSystemSettings: async () => {
        const response = await apiClient.get('/admin/settings');
        return response.data;
    },

    updateSystemSettings: async (settings) => {
        const response = await apiClient.patch('/admin/settings', settings);
        return response.data;
    },

    // Admin Notifications
    getAdminNotifications: async () => {
        const response = await apiClient.get('/admin/notifications');
        return response.data;
    },

    markAdminNotificationRead: async (id) => {
        const response = await apiClient.patch(`/admin/notifications/${id}/read`);
        return response.data;
    },

    clearAllAdminNotifications: async () => {
        const response = await apiClient.delete('/admin/notifications');
        return response.data;
    }
};

export default adminService;
