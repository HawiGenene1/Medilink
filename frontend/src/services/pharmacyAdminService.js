import api from './api';

/**
 * Pharmacy Admin API Service
 * Handles all platform-level pharmacy administration operations
 */

// Dashboard Statistics
export const getDashboardStats = async () => {
    const response = await api.get('/pharmacy-admin/dashboard-stats');
    return response.data;
};

// Registration Management
export const getRegistrations = async (params = {}) => {
    const response = await api.get('/pharmacy-admin/registrations', { params });
    return response.data;
};

export const getRegistrationDetails = async (id) => {
    const response = await api.get(`/pharmacy-admin/registrations/${id}`);
    return response.data;
};

export const approveRegistration = async (id, subscriptionPlan) => {
    const response = await api.put(`/pharmacy-admin/registrations/${id}/approve`, { subscriptionPlan });
    return response.data;
};

export const rejectRegistration = async (id, reason) => {
    const response = await api.put(`/pharmacy-admin/registrations/${id}/reject`, { reason });
    return response.data;
};

// Pharmacy Management
export const getAllPharmacies = async (params = {}) => {
    const response = await api.get('/pharmacy-admin/pharmacies', { params });
    return response.data;
};

export const updatePharmacyStatus = async (id, isActive, reason) => {
    const response = await api.put(`/pharmacy-admin/pharmacies/${id}/status`, { isActive, reason });
    return response.data;
};

// Subscription Management
export const getAllSubscriptions = async (params = {}) => {
    const response = await api.get('/pharmacy-admin/subscriptions', { params });
    return response.data;
};

export const assignSubscription = async (data) => {
    const response = await api.post('/pharmacy-admin/subscriptions', data);
    return response.data;
};

export const updateSubscription = async (id, data) => {
    const response = await api.put(`/pharmacy-admin/subscriptions/${id}`, data);
    return response.data;
};

export const getSubscriptionHistory = async (id) => {
    const response = await api.get(`/pharmacy-admin/subscriptions/${id}/history`);
    return response.data;
};

export const getSubscriptionPlans = async () => {
    const response = await api.get('/pharmacy-admin/subscription-plans');
    return response.data;
};

// Reports
export const generateReports = async (params = {}) => {
    const response = await api.get('/pharmacy-admin/reports', { params });
    return response.data;
};

// Alerts
export const getAlerts = async () => {
    const response = await api.get('/pharmacy-admin/alerts');
    return response.data;
};

// Profile & Settings
export const updateProfile = async (data) => {
    const response = await api.put('/users/profile', data);
    return response.data;
};

export const updateAdminSettings = async (settings) => {
    const response = await api.put('/users/profile', { settings });
    return response.data;
};

const pharmacyAdminService = {
    getDashboardStats,
    getRegistrations,
    getRegistrationDetails,
    approveRegistration,
    rejectRegistration,
    getAllPharmacies,
    updatePharmacyStatus,
    getAllSubscriptions,
    assignSubscription,
    updateSubscription,
    getSubscriptionHistory,
    getSubscriptionPlans,
    generateReports,
    getAlerts,
    updateProfile,
    updateAdminSettings
};

export default pharmacyAdminService;
