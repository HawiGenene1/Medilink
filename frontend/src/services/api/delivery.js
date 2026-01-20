import api from './config';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const deliveryAPI = {
  // Get delivery assignments for delivery person
  getMyDeliveries: async (params = {}) => {
    const response = await api.get(`${API_URL}/delivery/assignments`, { params });
    return response.data;
  },

  // Get delivery by ID
  getDeliveryById: async (id) => {
    const response = await api.get(`${API_URL}/delivery/${id}`);
    return response.data;
  },

  // Update delivery status
  updateDeliveryStatus: async (id, statusData) => {
    const response = await api.patch(`${API_URL}/delivery/${id}/status`, statusData);
    return response.data;
  },

  // Update delivery location
  updateLocation: async (id, locationData) => {
    const response = await api.post(`${API_URL}/delivery/${id}/location`, locationData);
    return response.data;
  },

  // Get delivery tracking info
  getTrackingInfo: async (id) => {
    const response = await api.get(`${API_URL}/delivery/${id}/tracking`);
    return response.data;
  },

  // Get delivery statistics
  getDeliveryStats: async () => {
    const response = await api.get(`${API_URL}/delivery/stats`);
    return response.data;
  },

  // Add delivery note
  addDeliveryNote: async (id, noteData) => {
    const response = await api.post(`${API_URL}/delivery/${id}/notes`, noteData);
    return response.data;
  }
};
