import apiClient from './config';

export const inventoryAPI = {
    get: (params) => apiClient.get('/inventory', { params }),
    add: (data) => apiClient.post('/inventory', data),
    getAlerts: () => apiClient.get('/inventory/alerts'),
    checkAlerts: () => apiClient.post('/inventory/check-alerts'),
    update: (id, data) => apiClient.put(`/inventory/${id}`, data),
    delete: (id) => apiClient.delete(`/inventory/${id}`)
};
