import apiClient from './config';

/**
 * Pharmacy Owner API Service
 */
export const pharmacyOwnerAPI = {
    /**
     * Register a new pharmacy owner
     */
    register: (data) => apiClient.post('/pharmacy-owner/register', data),

    /**
     * Login as pharmacy owner
     */
    login: (credentials) => apiClient.post('/pharmacy-owner/login', credentials),

    /**
     * Get dashboard stats
     */
    getDashboard: () => apiClient.get('/pharmacy-owner/dashboard'),

    /**
     * Get owner profile
     */
    getProfile: () => apiClient.get('/pharmacy-owner/profile'),

    /**
     * Update owner profile
     */
    updateProfile: (data) => apiClient.put('/pharmacy-owner/profile', data),

    /**
     * Update owner password
     */
    updatePassword: (data) => apiClient.put('/pharmacy-owner/profile/password', data),

    /**
     * Staff Management
     */
    getStaff: () => apiClient.get('/pharmacy-owner/staff'),
    createStaff: (data) => apiClient.post('/pharmacy-owner/staff', data),
    updateStaff: (id, data) => apiClient.put(`/pharmacy-owner/staff/${id}`, data),
    deleteStaff: (id) => apiClient.delete(`/pharmacy-owner/staff/${id}`),

    /**
     * Pharmacy Management
     */
    getPharmacy: () => apiClient.get('/pharmacy-owner/pharmacy'),
    updatePharmacy: (data) => apiClient.put('/pharmacy-owner/pharmacy', data),

    /**
     * Subscription & Billing
     */
    getSubscription: () => apiClient.get('/pharmacy-owner/subscription'),

    /**
     * Reports & Analytics
     */
    getReports: () => apiClient.get('/pharmacy-owner/reports'),
    getAnalytics: () => apiClient.get('/pharmacy-owner/analytics')
};

export default pharmacyOwnerAPI;
