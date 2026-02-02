import apiClient from './config';

const userService = {
    getProfile: async () => {
        const response = await apiClient.get('/users/profile');
        return response.data;
    },

    updateProfile: async (userData) => {
        const response = await apiClient.put('/users/profile', userData);
        return response.data;
    },

    updateSettings: async (settingsData) => {
        const response = await apiClient.patch('/users/settings', settingsData);
        return response.data;
    },

    uploadAvatar: async (formData) => {
        const response = await apiClient.post('/users/profile-image', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    deleteAccount: async () => {
        const response = await apiClient.delete('/users/profile');
        return response.data;
    }
};

export default userService;
