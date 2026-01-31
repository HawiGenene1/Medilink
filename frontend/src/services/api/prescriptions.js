// frontend/src/services/api/prescriptions.js
import api from './config';

const prescriptionsAPI = {
  // Upload a prescription
  upload: async (data) => {
    const formData = new FormData();
    formData.append('image', data.file);
    formData.append('doctorName', data.doctorName);
    formData.append('issueDate', data.issueDate);
    formData.append('expiryDate', data.expiryDate);
    if (data.notes) formData.append('notes', data.notes);

    return api.post('/prescriptions', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  // Get pending prescriptions (for pharmacy staff)
  getPending: async () => {
    return api.get('/prescriptions/pending');
  },

  // Update prescription status
  updateStatus: async (id, status, reviewNotes = '') => {
    return api.patch(`/prescriptions/${id}/status`, {
      status,
      reviewNotes
    });
  }
};

export default prescriptionsAPI;
