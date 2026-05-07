import apiClient from './client';

// Auth API calls
export const authAPI = {
    signup: async (signupData) => {
        const response = await apiClient.post('/auth/signup', signupData);
        return response.data;
    },

    login: async (email, password) => {
        const response = await apiClient.post('/auth/login', {
            email,
            password,
        });
        return response.data;
    },

    acceptInvite: async (inviteData) => {
        const response = await apiClient.post('/auth/accept-invite', inviteData);
        return response.data;
    },

    getInviteInfo: async (token) => {
        const response = await apiClient.get(`/auth/invite-info?token=${token}`);
        return response.data;
    },

    refresh: async (refreshToken) => {
        const response = await apiClient.post('/auth/refresh', {
            refresh_token: refreshToken,
        });
        return response.data;
    },

    logout: async () => {
        const response = await apiClient.post('/auth/logout');
        return response.data;
    },
};

// User API calls
export const userAPI = {
    getMe: async () => {
        const response = await apiClient.get('/auth/me');
        return response.data;
    },

    listSprints: async () => {
        const response = await apiClient.get('/sprints');
        return response.data;
    },

    updateAvatar: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post('/auth/avatar', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
};

// Health check
export const healthAPI = {
    check: async () => {
        const response = await apiClient.get('/health');
        return response.data;
    },
};
