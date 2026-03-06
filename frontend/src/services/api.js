import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';
export const BASE_URL = API_URL.split('/api')[0];

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
      // Handle unauthorized access
      localStorage.removeItem('token');
      window.location.href = '/login';
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
    api.get('/medicines/search', {
      params: {
        q: query,
        page,
        limit,
        ...filters
      }
    }),
  getById: (id) => api.get(`/medicines/${id}`),
  getCategories: () => api.get('/medicines/categories'),
};

// Orders API
export const ordersAPI = {
  create: (orderData) => api.post('/orders', orderData),
  getAll: (page = 1, limit = 10) =>
    api.get('/orders', { params: { page, limit } }),
  getById: (id) => api.get(`/orders/${id}`),
  cancel: (id) => api.patch(`/orders/${id}/cancel`),
  getStatus: (id) => api.get(`/orders/${id}/status`),
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
  register: (data) => api.post('/pharmacy-owner/register', data),
  login: (credentials) => api.post('/pharmacy-owner/login', credentials),
  getDashboard: () => api.get('/pharmacy-owner/dashboard'),
  getProfile: () => api.get('/pharmacy-owner/profile'),
  updateProfile: (data) => api.put('/pharmacy-owner/profile', data),
  updatePassword: (data) => api.put('/pharmacy-owner/profile/password', data),
  getStaff: () => api.get('/pharmacy-owner/staff'),
  createStaff: (data) => api.post('/pharmacy-owner/staff', data),
  updateStaff: (id, data) => api.put(`/pharmacy-owner/staff/${id}`, data),
  deleteStaff: (id) => api.delete(`/pharmacy-owner/staff/${id}`),
  getPharmacy: () => api.get('/pharmacy-owner/pharmacy'),
  updatePharmacy: (data) => api.put('/pharmacy-owner/pharmacy', data),
  getSubscription: () => api.get('/pharmacy-owner/subscription'),
  getReports: () => api.get('/pharmacy-owner/reports'),
  getAnalytics: () => api.get('/pharmacy-owner/analytics')
};

// Inventory API
export const inventoryAPI = {
  get: (params) => api.get('/inventory', { params }),
  add: (data) => api.post('/inventory', data),
  getAlerts: () => api.get('/inventory/alerts'),
  checkAlerts: () => api.post('/inventory/check-alerts'),
  update: (id, data) => api.put(`/inventory/${id}`, data),
  delete: (id) => api.delete(`/inventory/${id}`)
};

// Order Processing API
export const orderProcessingAPI = {
  getOrders: () => api.get('/order-processing'),
  updateStatus: (id, data) => api.put(`/order-processing/${id}/status`, data),
  verifyPrescription: (id, data) => api.put(`/order-processing/${id}/verify-prescription`, data),
  requestPhysicalPrescription: (id, data) => api.put(`/order-processing/${id}/request-physical-prescription`, data)
};

export default api;
