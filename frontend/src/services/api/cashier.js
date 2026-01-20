import api from '../api';

export const cashierAPI = {
  getStats: () => api.get('/cashier/stats'),
  getOrders: (params) => api.get('/cashier/orders', { params }),
  verifyPayment: (orderId) => api.post(`/cashier/verify/${orderId}`),
  generateInvoice: (orderId) => api.post(`/cashier/generate-invoice/${orderId}`),
  initiateRefund: (paymentId, data) => api.post(`/cashier/refund/${paymentId}`, data),
  getFinancialReport: (params) => api.get('/cashier/financial-report', { params }),
  exportReportPDF: (data) => api.post('/cashier/export-report', data),
};
