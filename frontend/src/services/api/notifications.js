import apiClient from './config';

/**
 * Get notifications for the current pharmacy user
 * @param {Object} params - Query parameters
 * @param {boolean} params.isRead - Filter by read status
 * @param {number} params.limit - Number of notifications per page
 * @param {number} params.page - Page number
 * @returns {Promise} API response with notifications
 */
export const getNotifications = async (params = {}) => {
    try {
        const response = await apiClient.get('/notifications', { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching notifications:', error);
        throw error;
    }
};

/**
 * Mark a notification as read
 * @param {string} notificationId - ID of the notification
 * @returns {Promise} API response
 */
export const markNotificationAsRead = async (notificationId) => {
    try {
        const response = await apiClient.put(`/notifications/${notificationId}/read`);
        return response.data;
    } catch (error) {
        console.error('Error marking notification as read:', error);
        throw error;
    }
};

/**
 * Mark all notifications as read
 * @returns {Promise} API response
 */
export const markAllNotificationsAsRead = async () => {
    try {
        const response = await apiClient.put('/notifications/read-all');
        return response.data;
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        throw error;
    }
};

/**
 * Delete a notification
 * @param {string} notificationId - ID of the notification
 * @returns {Promise} API response
 */
export const deleteNotification = async (notificationId) => {
    try {
        const response = await apiClient.delete(`/notifications/${notificationId}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting notification:', error);
        throw error;
    }
};

/**
 * Get unread notification count
 * @returns {Promise} API response with unread count
 */
export const getUnreadCount = async () => {
    try {
        const response = await apiClient.get('/notifications', {
            params: { isRead: false, limit: 1 }
        });
        return response.data.unreadCount || 0;
    } catch (error) {
        console.error('Error fetching unread count:', error);
        return 0;
    }
};
