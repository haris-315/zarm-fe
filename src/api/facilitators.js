import apiClient from './client';

// Facilitator API calls
export const facilitatorAPI = {
    createFacilitator: async (facilitatorData) => {
        const response = await apiClient.post('/admin/facilitators', facilitatorData);
        return response.data;
    },

    listFacilitators: async (page = 1, pageSize = 20) => {
        const response = await apiClient.get('/admin/facilitators', {
            params: { page, page_size: pageSize },
        });
        return response.data;
    },

    getFacilitator: async (facilitatorId) => {
        const response = await apiClient.get(`/admin/facilitators/${facilitatorId}`);
        return response.data;
    },

    updateFacilitator: async (facilitatorId, updateData) => {
        const response = await apiClient.patch(`/admin/facilitators/${facilitatorId}`, updateData);
        return response.data;
    },

    disableFacilitator: async (facilitatorId) => {
        const response = await apiClient.delete(`/admin/facilitators/${facilitatorId}`);
        return response.data;
    },

    assignRole: async (facilitatorId, roleId) => {
        const response = await apiClient.post(`/admin/facilitators/${facilitatorId}/role`, { role_id: roleId });
        return response.data;
    },

    setExtraPermissions: async (facilitatorId, permissions) => {
        const response = await apiClient.post(`/admin/facilitators/${facilitatorId}/extra-permissions`, { extra_permissions: permissions });
        return response.data;
    },

    getAssignedOrgs: async (facilitatorId) => {
        const response = await apiClient.get(`/admin/facilitators/${facilitatorId}/organizations`);
        return response.data;
    },

    assignOrgs: async (facilitatorId, organizationIds) => {
        const response = await apiClient.post(`/admin/facilitators/${facilitatorId}/organizations`, { organization_ids: organizationIds });
        return response.data;
    },

    removeOrg: async (facilitatorId, orgId) => {
        const response = await apiClient.delete(`/admin/facilitators/${facilitatorId}/organizations/${orgId}`);
        return response.data;
    },
};
