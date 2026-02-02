import api from '../api';

export const ordersAPI = {
  getMyOrders: () => api.get('/orders'),
  getOrderDetails: (id) => api.get(`/orders/${id}`),
  getTracking: (id) => api.get(`/orders/${id}/tracking`),
  cancelOrder: (id) => api.patch(`/orders/${id}/cancel`),

  // New Methods
  createOrder: (orderData) => api.post('/orders', orderData),
  initializeChapaPayment: (paymentData) => api.post('/payments/chapa/initialize', paymentData),
};
