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

// Payments API
export const paymentsAPI = {
  syncReceipt: (orderId) => api.get(`/payments/chapa/sync/${orderId}`),
};

// User API
export const userAPI = {
  uploadAvatar: (formData) =>
    api.post('/users/profile-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  updateProfile: (profileData) => api.put('/users/profile', profileData),
};

export default api;
