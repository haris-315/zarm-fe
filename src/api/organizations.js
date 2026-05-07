import apiClient from './client';

// Organization API calls
export const organizationAPI = {
    listOrganizations: async (page = 1, pageSize = 20) => {
        const response = await apiClient.get('/admin/organizations', {
            params: { page, page_size: pageSize },
        });
        return response.data;
    },

    getOrganization: async (orgId) => {
        const response = await apiClient.get(`/admin/organizations/${orgId}`);
        return response.data;
    },

    updateOrganization: async (orgId, updateData) => {
        const response = await apiClient.patch(`/admin/organizations/${orgId}`, updateData);
        return response.data;
    },

    suspendOrganization: async (orgId) => {
        const response = await apiClient.post(`/admin/organizations/${orgId}/suspend`);
        return response.data;
    },

    activateOrganization: async (orgId) => {
        const response = await apiClient.post(`/admin/organizations/${orgId}/activate`);
        return response.data;
    },

    approveOrganization: async (orgId) => {
        const response = await apiClient.post(`/admin/organizations/${orgId}/approve`);
        return response.data;
    },

    rejectOrganization: async (orgId, reason = '') => {
        const response = await apiClient.post(`/admin/organizations/${orgId}/reject`, { reason });
        return response.data;
    },

    listMembers: async (orgId, page = 1, pageSize = 20) => {
        const response = await apiClient.get(`/admin/organizations/${orgId}/members`, {
            params: { page, page_size: pageSize },
        });
        return response.data;
    },

    getMember: async (orgId, userId) => {
        const response = await apiClient.get(
            `/admin/organizations/${orgId}/members/${userId}`
        );
        return response.data;
    },

    updateMember: async (orgId, userId, updateData) => {
        const response = await apiClient.patch(
            `/admin/organizations/${orgId}/members/${userId}`,
            updateData
        );
        return response.data;
    },

    removeMember: async (orgId, userId) => {
        const response = await apiClient.delete(
            `/admin/organizations/${orgId}/members/${userId}`
        );
        return response.data;
    },

    inviteMember: async (orgId, memberData) => {
        const response = await apiClient.post(
            `/admin/organizations/${orgId}/members`,
            memberData
        );
        return response.data;
    },

    updateLogo: async (orgId, file) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post(`/admin/organizations/${orgId}/logo`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    updateMyOrgLogo: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post('/org/logo', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
};
