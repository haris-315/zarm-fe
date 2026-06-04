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

    // Organization Roles (org-level)
    listOrgRoles: async (orgId) => {
        const response = await apiClient.get(`/org/roles`);
        return response.data;
    },

    listOrgRolePermissions: async (orgId) => {
        const response = await apiClient.get(`/org/roles/permissions`);
        return response.data;
    },

    createOrgRole: async (orgId, roleData) => {
        const response = await apiClient.post(`/org/roles`, roleData);
        return response.data;
    },

    updateOrgRole: async (orgId, roleId, roleData) => {
        const response = await apiClient.patch(`/org/roles/${roleId}`, roleData);
        return response.data;
    },

    deleteOrgRole: async (orgId, roleId) => {
        const response = await apiClient.delete(`/org/roles/${roleId}`);
        return response.data;
    },

    // Organization Members (org-level)
    listOrgMembers: async (page = 1, pageSize = 20) => {
        const response = await apiClient.get(`/org/members`, {
            params: { page, page_size: pageSize },
        });
        return response.data;
    },

    getOrgMember: async (userId) => {
        const response = await apiClient.get(`/org/members/${userId}`);
        return response.data;
    },

    updateOrgMember: async (userId, updateData) => {
        const response = await apiClient.patch(`/org/members/${userId}`, updateData);
        return response.data;
    },

    removeOrgMember: async (userId) => {
        const response = await apiClient.delete(`/org/members/${userId}`);
        return response.data;
    },

    inviteOrgMember: async (memberData) => {
        const response = await apiClient.post(`/org/members`, memberData);
        return response.data;
    },
};
