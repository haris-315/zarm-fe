import apiClient from './client';

// Auth API calls
export const authAPI = {
    signup: async (signupData) => {
        const response = await apiClient.post('/auth/signup', signupData);
        return response.data;
    },

    personalSignup: async (signupData) => {
        const response = await apiClient.post('/auth/personal-signup', signupData);
        return response.data;
    },

    submitOrganizationInfo: async (orgData) => {
        const response = await apiClient.post('/auth/organization-info', orgData);
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

// Cohort API calls
export const cohortAPI = {
    getUpcoming: async () => {
        const response = await apiClient.get('/cohorts/upcoming');
        return response.data;
    },

    verifyCode: async (accessCode) => {
        const response = await apiClient.post('/cohorts/verify-code', {
            access_code: accessCode
        });
        return response.data;
    },

    listCohorts: async () => {
        const response = await apiClient.get('/cohorts/admin');
        return response.data;
    },

    createCohort: async (cohortData) => {
        const response = await apiClient.post('/cohorts/admin', cohortData);
        return response.data;
    },

    getCohortDetail: async (cohortId) => {
        const response = await apiClient.get(`/cohorts/admin/${cohortId}`);
        return response.data;
    },

    listCohortMembers: async (cohortId) => {
        const response = await apiClient.get(`/cohorts/admin/${cohortId}/members`);
        return response.data;
    },

    approveMember: async (cohortId, memberId) => {
        const response = await apiClient.post(`/cohorts/admin/${cohortId}/members/${memberId}/approve`);
        return response.data;
    },

    rejectMember: async (cohortId, memberId, reason) => {
        const url = reason 
            ? `/cohorts/admin/${cohortId}/members/${memberId}/reject?reason=${encodeURIComponent(reason)}`
            : `/cohorts/admin/${cohortId}/members/${memberId}/reject`;
        const response = await apiClient.post(url);
        return response.data;
    },

    assignConsultants: async (cohortId, payload) => {
        const response = await apiClient.post(`/cohorts/admin/${cohortId}/consultants`, payload);
        return response.data;
    }
};

// Health check
export const healthAPI = {
    check: async () => {
        const response = await apiClient.get('/health');
        return response.data;
    },
};
