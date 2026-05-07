import apiClient from './client';

// Organization Members API calls (for org admins managing their own members)
export const orgMembersAPI = {
    listMembers: async (page = 1, pageSize = 20) => {
        const response = await apiClient.get('/org/members', {
            params: { page, page_size: pageSize },
        });
        return response.data;
    },

    getMember: async (userId) => {
        const response = await apiClient.get(`/org/members/${userId}`);
        return response.data;
    },

    updateMember: async (userId, updateData) => {
        const response = await apiClient.patch(`/org/members/${userId}`, updateData);
        return response.data;
    },

    removeMember: async (userId) => {
        const response = await apiClient.delete(`/org/members/${userId}`);
        return response.data;
    },

    inviteMember: async (memberData) => {
        const response = await apiClient.post('/org/members', memberData);
        return response.data;
    },

    setMemberPermissions: async (userId, permissions) => {
        const response = await apiClient.put(`/org/members/${userId}/permissions`, {
            permissions,
        });
        return response.data;
    },

    listAvailablePermissions: async () => {
        const response = await apiClient.get('/org/permissions');
        return response.data;
    },
};
