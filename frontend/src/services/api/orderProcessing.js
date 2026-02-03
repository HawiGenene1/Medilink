import apiClient from './config';

export const orderProcessingAPI = {
    getOrders: () => apiClient.get('/order-processing'),
    updateStatus: (id, data) => apiClient.put(`/order-processing/${id}/status`, data),
    verifyPrescription: (id) => apiClient.put(`/order-processing/${id}/verify-prescription`)
};
