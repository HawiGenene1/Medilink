import api from './config';

// Upload prescription
export const uploadPrescription = async (formData) => {
  const response = await api.post('/prescriptions/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Get user's prescriptions
export const getPrescriptions = async (params = {}) => {
  const response = await api.get('/prescriptions', { params });
  return response.data;
};

// Get prescription details
export const getPrescriptionDetails = async (id) => {
  const response = await api.get(`/prescriptions/${id}`);
  return response.data;
};

// Update prescription status (pharmacy staff/admin)
export const updatePrescriptionStatus = async (id, data) => {
  const response = await api.patch(`/prescriptions/${id}/status`, data);
  return response.data;
};

// Delete prescription
export const deletePrescription = async (id) => {
  const response = await api.delete(`/prescriptions/${id}`);
  return response.data;
};
