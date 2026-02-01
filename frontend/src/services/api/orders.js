import axios from 'axios';
// TODO: Implement Orders API calls
// Functions: create order, get orders, update status, cancel order

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

export const ordersAPI = {
  getMyOrders: () => axios.get(`${API_URL}/orders`),
  getOrderDetails: (id) => axios.get(`${API_URL}/orders/${id}`),
  getTracking: (id) => axios.get(`${API_URL}/orders/${id}/tracking`),
  cancelOrder: (id) => axios.patch(`${API_URL}/orders/${id}/cancel`),
};
