import apiClient from './client';

export const meetingsAPI = {
    // Create a meeting
    createMeeting: async (sprintId, data) => {
        const response = await apiClient.post(`/sprints/${sprintId}/meetings`, data);
        return response.data;
    },

    // Get meetings for a sprint
    listSprintMeetings: async (sprintId, page = 1, pageSize = 20) => {
        const response = await apiClient.get(`/sprints/${sprintId}/meetings`, {
            params: { page, page_size: pageSize }
        });
        return response.data;
    },

    // Get meetings for an organization
    listOrgMeetings: async (orgId, page = 1, pageSize = 20) => {
        const response = await apiClient.get(`/organizations/${orgId}/meetings`, {
            params: { page, page_size: pageSize }
        });
        return response.data;
    },

    // Get a specific meeting
    getMeeting: async (meetingId) => {
        const response = await apiClient.get(`/meetings/${meetingId}`);
        return response.data;
    },

    // Update a meeting
    updateMeeting: async (meetingId, data) => {
        const response = await apiClient.patch(`/meetings/${meetingId}`, data);
        return response.data;
    },

    // Delete a meeting
    deleteMeeting: async (meetingId) => {
        await apiClient.delete(`/meetings/${meetingId}`);
    },
};
