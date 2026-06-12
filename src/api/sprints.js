import apiClient from './client';

export const sprintAPI = {
    // ── Organizations (for facilitators) ──────────────────────
    listOrganizations: async (page = 1, pageSize = 20) => {
        const response = await apiClient.get('/org', {
            params: { page, page_size: pageSize },
        });
        return response.data;
    },

    // ── Sprints ───────────────────────────────────────────────
    listSprints: async (orgId, page = 1, pageSize = 20) => {
        const response = await apiClient.get(`/organizations/${orgId}/sprints`, {
            params: { page, page_size: pageSize },
        });
        return response.data;
    },

    createSprint: async (orgId, data) => {
        const payload = {
            organization_id: orgId,
            title: data.title,
            description: data.notes ? `${data.engagement_name ? data.engagement_name + ' - ' : ''}${data.notes}` : (data.engagement_name || ''),
            start_date: data.scheduled_start,
            end_date: data.scheduled_end,
        };
        const response = await apiClient.post('/sprints', payload);
        return response.data;
    },

    getSprint: async (sprintId) => {
        const response = await apiClient.get(`/sprints/${sprintId}`);
        return response.data;
    },

    updateSprint: async (sprintId, data) => {
        const response = await apiClient.patch(`/sprints/${sprintId}`, data);
        return response.data;
    },

    advanceSprint: async (sprintId, status) => {
        const response = await apiClient.post(`/sprints/${sprintId}/${status}`);
        return response.data;
    },

    getMetrics: async (sprintId) => {
        const response = await apiClient.get(`/sprints/${sprintId}/timeline`);
        return response.data?.summary || {};
    },

    // ── Participants ──────────────────────────────────────────
    addParticipant: async (sprintId, userId, role) => {
        const response = await apiClient.post(`/sprints/${sprintId}/participants`, {
            user_id: userId,
            role,
        });
        return response.data;
    },

    removeParticipant: async (sprintId, userId) => {
        await apiClient.delete(`/sprints/${sprintId}/participants/${userId}`);
    },

    // ── Findings ─────────────────────────────────────────────
    listFindings: async (sprintId, day = null, page = 1, pageSize = 20) => {
        const params = { page, page_size: pageSize };
        if (day) params.day = day;
        const response = await apiClient.get(`/sprints/${sprintId}/findings`, { params });
        return response.data;
    },

    createFinding: async (sprintId, data) => {
        const payload = { ...data, sprint_id: sprintId };
        const response = await apiClient.post(`/findings`, payload);
        return response.data;
    },

    updateFinding: async (sprintId, findingId, data) => {
        const response = await apiClient.patch(
            `/findings/${findingId}`,
            data
        );
        return response.data;
    },

    addFindingComment: async (sprintId, findingId, content, isInternal = false) => {
        console.warn("Commenting is not yet supported in the backend.");
        return null;
    },

    // ── Decision Cards ────────────────────────────────────────
    listDecisionCards: async (sprintId, page = 1, pageSize = 20) => {
        const response = await apiClient.get(`/decision-cards`, {
            params: { page, page_size: pageSize },
        });
        return response.data;
    },

    createDecisionCard: async (sprintId, data) => {
        const payload = { ...data, sprint_id: sprintId };
        const response = await apiClient.post(`/decision-cards`, payload);
        return response.data;
    },

    updateDecisionCard: async (sprintId, cardId, data) => {
        const response = await apiClient.patch(
            `/decision-cards/${cardId}`,
            data
        );
        return response.data;
    },

    publishDecisionCard: async (sprintId, cardId) => {
        const response = await apiClient.post(
            `/decision-cards/${cardId}/publish`
        );
        return response.data;
    },

    addDecisionComment: async (sprintId, cardId, content) => {
        console.warn("Commenting is not yet supported in the backend.");
        return null;
    },

    // ── Reports ───────────────────────────────────────────────
    listReports: async (sprintId, page = 1, pageSize = 20) => {
        const response = await apiClient.get(`/reports`, {
            params: { page, page_size: pageSize },
        });
        return response.data;
    },

    createReport: async (sprintId, title, file) => {
        const payload = { title, sprint_id: sprintId, report_type: 'pdf' };
        const response = await apiClient.post(`/reports`, payload);
        return response.data;
    },

    getReportUrl: async (sprintId, reportId) => {
        const response = await apiClient.get(`/reports/${reportId}`);
        return response.data;
    },

    getReportDownloadUrl: (sprintId, reportId) => {
        return apiClient.defaults.baseURL + `/reports/${reportId}`;
    },

    getUploadProgress: async (jobId) => {
        const response = await apiClient.get(`/uploads/${jobId}/progress`);
        return response.data;
    },
};
