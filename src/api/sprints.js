import apiClient from './client';

export const sprintAPI = {
    // ── Organizations (for facilitators) ──────────────────────
    listOrganizations: async (page = 1, pageSize = 20) => {
        const response = await apiClient.get('/organizations', {
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
        const response = await apiClient.post(`/organizations/${orgId}/sprints`, data);
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
        const response = await apiClient.post(`/sprints/${sprintId}/advance`, { status });
        return response.data;
    },

    getMetrics: async (sprintId) => {
        const response = await apiClient.get(`/sprints/${sprintId}/metrics`);
        return response.data;
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
        const response = await apiClient.post(`/sprints/${sprintId}/findings`, data);
        return response.data;
    },

    updateFinding: async (sprintId, findingId, data) => {
        const response = await apiClient.patch(
            `/sprints/${sprintId}/findings/${findingId}`,
            data
        );
        return response.data;
    },

    addFindingComment: async (sprintId, findingId, content, isInternal = false) => {
        const response = await apiClient.post(
            `/sprints/${sprintId}/findings/${findingId}/comments`,
            { content, is_internal: isInternal }
        );
        return response.data;
    },

    // ── Decision Cards ────────────────────────────────────────
    listDecisionCards: async (sprintId, page = 1, pageSize = 20) => {
        const response = await apiClient.get(`/sprints/${sprintId}/decision-cards`, {
            params: { page, page_size: pageSize },
        });
        return response.data;
    },

    createDecisionCard: async (sprintId, data) => {
        const response = await apiClient.post(`/sprints/${sprintId}/decision-cards`, data);
        return response.data;
    },

    updateDecisionCard: async (sprintId, cardId, data) => {
        const response = await apiClient.patch(
            `/sprints/${sprintId}/decision-cards/${cardId}`,
            data
        );
        return response.data;
    },

    publishDecisionCard: async (sprintId, cardId) => {
        const response = await apiClient.post(
            `/sprints/${sprintId}/decision-cards/${cardId}/publish`
        );
        return response.data;
    },

    addDecisionComment: async (sprintId, cardId, content) => {
        const response = await apiClient.post(
            `/sprints/${sprintId}/decision-cards/${cardId}/comments`,
            { content }
        );
        return response.data;
    },

    // ── Reports ───────────────────────────────────────────────
    listReports: async (sprintId, page = 1, pageSize = 20) => {
        const response = await apiClient.get(`/sprints/${sprintId}/reports`, {
            params: { page, page_size: pageSize },
        });
        return response.data;
    },

    createReport: async (sprintId, title, file) => {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('file', file);
        const response = await apiClient.post(`/sprints/${sprintId}/reports`, formData, {
            headers: { 'Content-Type': undefined },
        });
        return response.data; // Returns { report_id, job_id, filename }
    },

    getReportUrl: async (sprintId, reportId) => {
        const response = await apiClient.get(`/sprints/${sprintId}/reports/${reportId}/url`);
        return response.data; // { url, file_type }
    },

    getReportDownloadUrl: (sprintId, reportId) => {
        // Returns the backend proxy URL — no CORS issues since it's same-origin
        return apiClient.defaults.baseURL + `/sprints/${sprintId}/reports/${reportId}/download`;
    },

    getUploadProgress: async (jobId) => {
        const response = await apiClient.get(`/uploads/${jobId}/progress`);
        return response.data;
    },
};
