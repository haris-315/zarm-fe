import apiClient from './client';

export const rolesAPI = {
    listRoles: async () => {
        const response = await apiClient.get('/admin/roles');
        return response.data;
    },

    getAvailablePermissions: async () => {
        const response = await apiClient.get('/admin/roles/available-permissions');
        return response.data;
    },

    createRole: async (roleData) => {
        const response = await apiClient.post('/admin/roles', roleData);
        return response.data;
    },

    updateRole: async (roleId, updateData) => {
        const response = await apiClient.patch(`/admin/roles/${roleId}`, updateData);
        return response.data;
    },

    deleteRole: async (roleId) => {
        const response = await apiClient.delete(`/admin/roles/${roleId}`);
        return response.data;
    },
};
