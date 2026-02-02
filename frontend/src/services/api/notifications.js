import apiClient from './config';

const notificationService = {
    getNotifications: async () => {
        const response = await apiClient.get('/notifications');
        return response.data;
    },

    markRead: async (id) => {
        const response = await apiClient.patch(`/notifications/${id}/read`);
        return response.data;
    },

    markAllRead: async () => {
        const response = await apiClient.patch('/notifications/read-all');
        return response.data;
    },

    deleteNotification: async (id) => {
        const response = await apiClient.delete(`/notifications/${id}`);
        return response.data;
    },

    clearAll: async () => {
        const response = await apiClient.delete('/notifications');
        return response.data;
    }
};

export default notificationService;
