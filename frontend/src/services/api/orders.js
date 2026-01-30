import apiClient from './config';
// TODO: Implement Orders API calls
// Functions: create order, get orders, update status, cancel order

export const ordersAPI = {
  createOrder: (orderData) => apiClient.post('/orders', orderData),
  getMyOrders: () => apiClient.get('/orders'),
  getOrderDetails: (id) => apiClient.get(`/orders/${id}`),
  getTracking: (id) => apiClient.get(`/orders/${id}/tracking`),
  cancelOrder: (id) => apiClient.patch(`/orders/${id}/cancel`),
};
