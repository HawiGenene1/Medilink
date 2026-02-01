import apiClient from './config';

const adminService = {
    // Dashboard Analytics
    getDashboardStats: async () => {
        const response = await apiClient.get('/admin/analytics/dashboard');
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

    // Registration Management
    getPendingRegistrations: async () => {
        const response = await apiClient.get('/admin/registrations/pending');
        return response.data;
    }
};

export default adminService;
