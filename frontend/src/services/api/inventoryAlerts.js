import apiClient from './config';

/**
 * Get inventory alerts summary and details
 * @returns {Promise} API response with alert data
 */
export const getInventoryAlerts = async () => {
    try {
        const response = await apiClient.get('/inventory/alerts');
        return response.data;
    } catch (error) {
        console.error('Error fetching inventory alerts:', error);
        throw error;
    }
};

/**
 * Manually trigger an alert check for the pharmacy
 * @returns {Promise} API response
 */
export const checkInventoryAlerts = async () => {
    try {
        const response = await apiClient.post('/inventory/check-alerts');
        return response.data;
    } catch (error) {
        console.error('Error checking inventory alerts:', error);
        throw error;
    }
};
