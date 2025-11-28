import apiClient from './config';

// Medicines API helpers used by frontend pages
export const medicinesAPI = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiClient.get(`/medicines${qs ? `?${qs}` : ''}`);
  },
  getById: (id) => apiClient.get(`/medicines/${id}`),
};

export default medicinesAPI;
