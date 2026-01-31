import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // In development mode with mock tokens, don't auto-logout
      const token = localStorage.getItem('token');
      const isMockToken = token && token.startsWith('header.');

      if (process.env.NODE_ENV === 'development' && isMockToken) {
        // Don't redirect, just reject the error - mock mode doesn't use real API
        console.warn('Development mode: API call returned 401 with mock token');
        return Promise.reject(error);
      }

      // Handle unauthorized access in production
      localStorage.removeItem('token');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
};

// Medicines API
export const medicinesAPI = {
  search: (query, filters = {}, page = 1, limit = 10) =>
    api.get('/medicines', {
      params: {
        search: query,
        page,
        limit,
        ...filters
      }
    }),
  getById: (id) => api.get(`/medicines/${id}`),
  getCategories: () => api.get('/medicines/categories'),
  // Pharmacy management
  getAll: (params) => api.get('/medicines', { params }),
  add: (data) => api.post('/medicines', data),
  update: (id, data) => api.put(`/medicines/${id}`, data),
  delete: (id) => api.delete(`/medicines/${id}`),
  updateStock: (id, adjustment) => api.patch(`/medicines/${id}/stock`, { adjustment }),
};

// Orders API
export const ordersAPI = {
  create: (orderData) => api.post('/orders', orderData),
  getAll: (page = 1, limit = 10) =>
    api.get('/orders', { params: { page, limit } }),
  getById: (id) => api.get(`/orders/${id}`),
  cancel: (id) => api.patch(`/orders/${id}/cancel`),
  getStatus: (id) => api.get(`/orders/${id}/status`),
  // Pharmacy Staff endpoints
  getPharmacyOrders: (pharmacyId, params) =>
    api.get(`/orders/pharmacy/${pharmacyId}`, { params }),
  updateStatus: (orderId, status) =>
    api.put(`/orders/${orderId}/status`, { status }),
};

// Prescriptions API
export const prescriptionsAPI = {
  upload: (formData) =>
    api.post('/prescriptions', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  getAll: (page = 1, limit = 10) =>
    api.get('/prescriptions', { params: { page, limit } }),
  getById: (id) => api.get(`/prescriptions/${id}`),
  updateStatus: (id, status) =>
    api.patch(`/prescriptions/${id}/status`, { status }),
};

// Cart API
export const cartAPI = {
  getCart: () => api.get('/cart'),
  addItem: (medicineId, quantity = 1) =>
    api.post('/cart/items', { medicineId, quantity }),
  updateItem: (itemId, quantity) =>
    api.patch(`/cart/items/${itemId}`, { quantity }),
  removeItem: (itemId) => api.delete(`/cart/items/${itemId}`),
  clearCart: () => api.delete('/cart'),
};

// Pharmacy Owner API
export const pharmacyOwnerAPI = {
  register: (ownerData) => api.post('/pharmacy-owner/register', ownerData),
  login: (email, password) => api.post('/pharmacy-owner/login', { email, password }),
  getDashboard: () => api.get('/pharmacy-owner/dashboard'),
  getProfile: () => api.get('/pharmacy-owner/profile'),
  updateProfile: (data) => api.put('/pharmacy-owner/profile', data),
  updatePassword: (data) => api.put('/pharmacy-owner/profile/password', data),
  getSubscription: () => api.get('/pharmacy-owner/subscription'),
  getReports: () => api.get('/pharmacy-owner/reports'),
  getAnalytics: () => api.get('/pharmacy-owner/analytics'),
  getPharmacy: () => api.get('/pharmacy-owner/pharmacy'),
  updatePharmacy: (data) => api.put('/pharmacy-owner/pharmacy', data),
  // Staff Management
  getStaff: () => api.get('/pharmacy-owner/staff'),
  createStaff: (data) => api.post('/pharmacy-owner/staff', data),
  updateStaff: (id, data) => api.put(`/pharmacy-owner/staff/${id}`, data),
  deleteStaff: (id) => api.delete(`/pharmacy-owner/staff/${id}`),
};

// Inventory API
export const inventoryAPI = {
  get: () => api.get('/inventory'),
  add: (data) => api.post('/inventory', data),
  update: (id, data) => api.put(`/inventory/${id}`, data),
  delete: (id) => api.delete(`/inventory/${id}`),
};

// Order Processing API (Staff)
export const orderProcessingAPI = {
  getOrders: (params) => api.get('/order-processing', { params }),
  updateStatus: (id, statusData) => api.put(`/order-processing/${id}/status`, statusData),
  verifyPrescription: (id, verificationData) => api.put(`/order-processing/${id}/verify-prescription`, verificationData),
};

export default api;
