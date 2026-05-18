import apiClient from './client';

export const rolesAPI = {
    listRoles: async (page = 1, pageSize = 100) => {
        const response = await apiClient.get('/admin/roles', {
            params: { page, page_size: pageSize },
        });
        return response.data;
    },

    getAvailablePermissions: async () => {
        const response = await apiClient.get('/admin/roles/available-permissions');
        return response.data;
    },

    createRole: async ({ name, description, permission_codes }) => {
        const response = await apiClient.post('/admin/roles', { name, description, permission_codes });
        return response.data;
    },

    updateRole: async (roleId, { description, permission_codes }) => {
        const response = await apiClient.patch(`/admin/roles/${roleId}`, { description, permission_codes });
        return response.data;
    },

    deleteRole: async (roleId) => {
        const response = await apiClient.delete(`/admin/roles/${roleId}`);
        return response.data;
    },
};
